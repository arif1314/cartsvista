import { ok, fail } from '@/lib/api/response';
import { categoriesToNavigation } from '@/lib/catalog/format';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return fail(error.message, 500);

  return ok({ categories: categoriesToNavigation(data || []) });
}
