import { ok, fail } from '@/lib/api/response';
import { brandToClient } from '@/lib/catalog/format';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) return fail(error.message, 500);

  return ok({ brands: (data || []).map(brandToClient) });
}
