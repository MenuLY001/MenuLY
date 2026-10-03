import { supabaseAdmin } from './supabase-admin';

export async function logAudit({
  actorId,
  actorType = 'super_admin',
  action,
  targetId,
  targetType,
  metadata
}: {
  actorId?: string;
  actorType?: string;
  action: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from('audit_log').insert({
      actor_id: actorId,
      actor_type: actorType,
      action,
      target_id: targetId,
      target_type: targetType,
      metadata
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
