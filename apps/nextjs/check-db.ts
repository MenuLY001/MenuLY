import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: subs } = await supabase.from('subscriptions').select('*');
  const { data: rests } = await supabase.from('restaurants').select('*');
  const { data: pays } = await supabase.from('payments').select('*');
  
  console.log('Subscriptions:', JSON.stringify(subs, null, 2));
  console.log('Restaurants:', JSON.stringify(rests, null, 2));
  console.log('Payments:', JSON.stringify(pays, null, 2));
}

main();
