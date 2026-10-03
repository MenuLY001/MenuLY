import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Un-cancel the restaurant
  await supabase.from('restaurants').update({ status: 'active' }).eq('slug', 'mani');
  
  // Un-cancel the subscription so the frontend sees it as active
  await supabase.from('subscriptions').update({ 
    status: 'active',
    cancelled_at: null 
  }).eq('razorpay_subscription_id', 'sub_TjVW2Lj52tc4qX');

  console.log('Restored the restaurant to Active!');
}

main();
