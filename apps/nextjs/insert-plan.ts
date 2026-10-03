import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('plans').insert({
    name: 'Menuly Pro',
    description: '₹299/month — Restaurant QR Menu Platform',
    price_paise: 29900,
    currency: 'INR',
    interval: 'monthly',
    razorpay_plan_id: 'plan_TjPVMy0KrNXEvf',
    is_active: true,
  }).select();

  if (error) {
    console.error('Failed to insert plan:', error);
    process.exit(1);
  }
  console.log('Successfully inserted plan:', data);
}

main();
