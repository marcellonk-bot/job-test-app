import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(
    fs.readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => line.split('='))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log("Logging in...");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
        email: 'employer@test.com', 
        password: 'demo123' 
    });
    
    if (loginError) {
        console.error('Login Error:', loginError);
        return;
    }
    
    console.log("Logged in. Attempting to delete...");
    const { data, error } = await supabase
        .from('jobs_table')
        .delete()
        .eq('job_title', 'Marketing Manager')
        .select();
        
    console.log('Delete Output Data:', data);
    console.log('Delete Output Error:', error);
}

test();
