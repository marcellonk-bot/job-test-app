import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatInterface from '../components/Interview/ChatInterface';
import EmployerInterviewSummary from '../components/Interview/EmployerInterviewSummary';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const InterviewView = () => {
    const { user, selectedRole } = useAuth();
    const [searchParams] = useSearchParams();
    const [interviewContext, setInterviewContext] = useState(null);
    const [isLoadingContext, setIsLoadingContext] = useState(true);
    const [applicationId, setApplicationId] = useState(null);

    useEffect(() => {
        const initializeInterview = async () => {
            if (!user || selectedRole === 'employer') {
                setIsLoadingContext(false);
                return;
            }

            try {
                // Get application_id from URL or localStorage
                const appId = searchParams.get('application_id') || localStorage.getItem('current_application_id');

                if (appId) {
                    setApplicationId(appId);
                    await fetchInterviewContext(appId);
                } else {
                    // If no application_id, create a demo interview context
                    await createDemoInterviewContext();
                }
            } catch (error) {
                console.error('Error initializing interview:', error);
                await createDemoInterviewContext();
            } finally {
                setIsLoadingContext(false);
            }

            // Create candidate record if resume data exists
            const savedData = localStorage.getItem('jobtify_resume_data');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);

                    const { error } = await supabase
                        .from('candidates')
                        .insert([
                            {
                                user_id: user.id,
                                full_name: user?.user_metadata?.full_name || parsedData.fileName.split('.')[0] || 'Candidate',
                                resume_score: parsedData.score,
                                summary: parsedData.summary,
                                interview_score: 0
                            }
                        ]);

                    if (error && error.code !== '23505') { // Ignore duplicate key errors
                        console.error('Error inserting candidate record:', error);
                    } else {
                        localStorage.removeItem('jobtify_resume_data');
                    }
                } catch (err) {
                    console.error('Error parsing resume data:', err);
                }
            }
        };

        initializeInterview();
    }, [user, selectedRole, searchParams]);

    const fetchInterviewContext = async (appId) => {
        try {
            // Fetch application
            const { data: application, error: appError } = await supabase
                .from('applications_table')
                .select('job_id, candidate_id')
                .eq('id', appId)
                .single();

            if (appError) throw appError;

            // Fetch job details
            const { data: job, error: jobError } = await supabase
                .from('jobs_table')
                .select('job_title, job_description, required_skills')
                .eq('id', application.job_id)
                .single();

            if (jobError) throw jobError;

            // Fetch candidate profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles_table')
                .select('full_name, skills, bio')
                .eq('user_id', user.id)
                .single();

            // Build context
            setInterviewContext({
                candidateName: profile?.full_name || user?.user_metadata?.full_name || 'Candidate',
                jobTitle: job.job_title,
                jobDescription: job.job_description,
                requiredSkills: job.required_skills || [],
                skills: profile?.skills || [],
                applicationId: appId
            });
        } catch (error) {
            console.error('Error fetching interview context:', error);
            await createDemoInterviewContext();
        }
    };

    const createDemoInterviewContext = async () => {
        // Fetch first available job or create demo context
        const { data: jobs } = await supabase
            .from('jobs_table')
            .select('job_title, job_description, required_skills')
            .limit(1)
            .single();

        const { data: profile } = await supabase
            .from('profiles_table')
            .select('full_name, skills')
            .eq('user_id', user.id)
            .single();

        setInterviewContext({
            candidateName: profile?.full_name || user?.user_metadata?.full_name || 'Candidate',
            jobTitle: jobs?.job_title || 'Software Engineer',
            jobDescription: jobs?.job_description || 'We are looking for a talented professional to join our team.',
            requiredSkills: jobs?.required_skills || ['Problem Solving', 'Communication', 'Teamwork'],
            skills: profile?.skills || [],
            applicationId: null
        });
    };

    if (selectedRole === 'employer') {
        return (
            <div className="flex flex-col h-screen max-w-6xl mx-auto p-4 md:p-6 pt-24 md:pt-32 pb-24 border-none">
                <EmployerInterviewSummary />
            </div>
        );
    }

    if (isLoadingContext) {
        return (
            <div className="flex flex-col h-screen items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Preparing your interview...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-6 pt-24 md:pt-32">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Jobtify.my</h1>
                    <p className="text-slate-500 text-sm">AI Simulation Interview</p>
                    {interviewContext && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                            Position: {interviewContext.jobTitle}
                        </p>
                    )}
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Live Session
                </div>
            </header>

            <main className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <ChatInterface
                    interviewContext={interviewContext}
                    applicationId={applicationId}
                />
            </main>
        </div>
    );
};

export default InterviewView;
