import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    await getSuperAdminContext(req);
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(plans);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSuperAdminContext(req);
    const body = await req.json();

    const { name, description, price_paise, currency, interval, razorpay_plan_id, is_active } = body;
    
    if (!name || !price_paise) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('plans')
      .insert({
        name,
        description,
        price_paise,
        currency: currency || 'INR',
        interval: interval || 'monthly',
        razorpay_plan_id: razorpay_plan_id || null,
        is_active: is_active ?? true
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      actorId: user.userId,
      action: 'plan.create',
      targetId: data.id,
      targetType: 'plan',
      metadata: { name, price_paise }
    });

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
