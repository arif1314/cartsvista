import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxcntpprvaeoeaojetxt.supabase.co';
const supabaseKey = 'sb_publishable_44Su8gUvmq482GfD0je0Gw__hGNdX40';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching banners...");
  const { data, error } = await supabase.from('banners').select('*');
  if (error) {
    console.error("Error fetching banners:", error);
  } else {
    console.log("Banners:", data);
  }
}

test();
