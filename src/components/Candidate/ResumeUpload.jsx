import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import axios from 'axios';

const ResumeUpload = ({ onSuccess }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;

        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            setErrorMessage('Please upload a PDF or DOCX file.');
            setStatus('error');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
            setErrorMessage('File is too large. Max size is 5MB.');
            setStatus('error');
            return;
        }

        setFile(selectedFile);
        setStatus('idle');
        setErrorMessage('');
    };

    const uploadResume = async () => {
        if (!file) return;

        setStatus('uploading');
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await axios.post('https://n8n.ibrandiumtech.com/webhook/get-resume', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });

            console.log('Resume parsed successfully:', response.data);
            setStatus('success');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error uploading resume:', error);
            setErrorMessage('Failed to parse resume. Please try again.');
            setStatus('error');
        }
    };

    const resetUpload = () => {
        setFile(null);
        setStatus('idle');
        setErrorMessage('');
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                className={`relative border-2 border-dashed rounded-3xl p-10 transition-all ${isDragging
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                />

                {status === 'idle' && !file && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                            <Upload className="text-blue-600" size={28} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2 font-display">Upload your resume</h4>
                        <p className="text-slate-500 text-sm mb-6">Drag and drop your PDF or DOCX file here</p>
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                        >
                            Select File
                        </button>
                    </div>
                )}

                {file && status !== 'success' && status !== 'uploading' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                            <FileText className="text-blue-600" size={28} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1 truncate px-4">{file.name}</h4>
                        <p className="text-slate-500 text-xs mb-6">{(file.size / 1024).toFixed(1)} KB</p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={uploadResume}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                Upload & Parse
                            </button>
                            <button
                                onClick={resetUpload}
                                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {status === 'uploading' && (
                    <div className="text-center py-4">
                        <Loader2 className="text-blue-600 animate-spin mx-auto mb-6" size={40} />
                        <h4 className="text-lg font-bold text-slate-900 mb-4">Parsing Resume...</h4>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2 max-w-xs mx-auto">
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{uploadProgress}% uploaded</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <CheckCircle className="text-emerald-600" size={28} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2 font-display">Verification Complete!</h4>
                        <p className="text-slate-500 text-sm mb-6 max-w-[250px] mx-auto">
                            We've successfully parsed your resume and optimized your candidacy profile.
                        </p>
                        <button
                            onClick={resetUpload}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                        >
                            Upload Another
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                            <AlertCircle className="text-red-600" size={28} />
                        </div>
                        <h4 className="text-lg font-bold text-red-600 mb-2">Upload Failed</h4>
                        <p className="text-slate-500 text-sm mb-6">{errorMessage}</p>
                        <button
                            onClick={resetUpload}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeUpload;
