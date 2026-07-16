import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { categoriesToNavigation } from '@/lib/catalog/format';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { slugifyProductName } from '@/lib/validation/product';

function normalizeCategoryPayload(body = {}) {
  const name = String(body.name || body.title || '').trim();
  const slug = slugifyProductName(body.slug || name);
  return {
    category: {
      name,
      slug,
      parent_id: body.parentId || body.parent_id || null,
      description: String(body.description || '').trim() || null,
      is_active: body.isActive ?? body.is_active ?? true,
      sort_order: Number(body.sortOrder ?? body.sort_order ?? 0),
    },
    errors: {
      ...(!name ? { name: 'Category name is required.' } : {}),
      ...(!slug ? { slug: 'Category slug is required.' } : {}),
    },
  };
}

export async function GET(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return fail(error.message, 500);

  return ok({ categories: categoriesToNavigation(data || []) });
}

export async function POST(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const body = await request.json();
  const { category, errors } = normalizeCategoryPayload(body);
  if (Object.keys(errors).length > 0) return fail('Invalid category data.', 422, errors);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('categories')
    .insert(category)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'category.create',
    entity_type: 'category',
    entity_id: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return ok({ category: data }, { status: 201 });
}
