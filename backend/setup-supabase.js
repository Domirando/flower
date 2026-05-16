import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
    console.log('Starting Supabase setup...');

    // 1. Create 'books' bucket if it doesn't exist
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    if (getBucketsError) {
        console.error('Error listing buckets:', getBucketsError);
        return;
    }

    const booksBucket = buckets.find(b => b.name === 'books');
    if (!booksBucket) {
        console.log('Creating "books" bucket...');
        const { error: createBucketError } = await supabase.storage.createBucket('books', {
            public: true,
            allowedMimeTypes: ['application/pdf', 'application/epub+zip', 'text/plain'],
            fileSizeLimit: 52428800 // 50MB
        });
        if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
        } else {
            console.log('"books" bucket created successfully.');
        }
    } else {
        console.log('"books" bucket already exists.');
    }

    // 2. Create 'books' table if it doesn't exist
    // Note: createClient with service role can't easily run arbitrary SQL for table creation 
    // without the 'pg' library or a custom RPC. 
    // But we can check if it exists by trying to select from it.
    
    console.log('Checking "books" table...');
    const { error: tableError } = await supabase.from('books').select('id').limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
        // Table doesn't exist, we can't create it via SDK directly.
        // We'll instruct the user to run SQL in the dashboard.
        console.log('\n--- IMPORTANT ---');
        console.log('The "books" table does not exist. Please run the following SQL in your Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    authors TEXT[] DEFAULT '{}',
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow individual insert" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual update" ON public.books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow individual delete" ON public.books FOR DELETE USING (auth.uid() = user_id);
        `);
    } else if (tableError) {
        console.error('Error checking books table:', tableError.message);
    } else {
        console.log('"books" table already exists.');
    }

    console.log('\nSetup check complete.');
}

setup();
