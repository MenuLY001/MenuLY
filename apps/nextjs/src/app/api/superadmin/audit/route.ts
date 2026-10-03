import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await getSuperAdminContext(req);

    const { data: logs, error } = await supabaseAdmin
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Fetch restaurant names for context
    const restaurantIds = Array.from(new Set(logs?.filter(l => l.target_type === 'restaurant').map(l => l.target_id) || []));
    
    let restaurantMap: Record<string, string> = {};
    if (restaurantIds.length > 0) {
      const { data: restaurants } = await supabaseAdmin
        .from('restaurants')
        .select('id, name')
        .in('id', restaurantIds);
        
      if (restaurants) {
        restaurantMap = restaurants.reduce((acc, r) => ({ ...acc, [r.id]: r.name }), {});
      }
    }

    const enrichedLogs = logs?.map(log => ({
      ...log,
      target_name: log.target_type === 'restaurant' && log.target_id ? restaurantMap[log.target_id] || 'Unknown' : null
    }));

    return NextResponse.json(enrichedLogs || []);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Failed to fetch audit logs:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
