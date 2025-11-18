import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log('Starting duplicate cleanup...');

  // Delete duplicates keeping only the earliest ID for each user_id + track_id + played_at combination
  const { error } = await supabase.rpc('delete_duplicate_plays');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✓ Duplicates removed successfully');
}

cleanupDuplicates();
