import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { brandToClient } from '@/lib/catalog/format';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { slugifyProductName } from '@/lib/validation/product';

function normalizeBrandPayload(body = {}) {
  const name = String(body.name || '').trim();
  const slug = slugifyProductName(body.slug || name);
  return {
    brand: {
      name,
      slug,
      logo_url: String(body.logoUrl || body.logo_url || '').trim() || null,
      is_active: body.isActive ?? body.is_active ?? true,
    },
    errors: {
      ...(!name ? { name: 'Brand name is required.' } : {}),
      ...(!slug ? { slug: 'Brand slug is required.' } : {}),
    },
  };
}

export async function GET(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('brands')
    .select('*')
    .order('name', { ascending: true });

  if (error) return fail(error.message, 500);

  return ok({ brands: (data || []).map(brandToClient) });
}

export async function POST(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { brand, errors } = normalizeBrandPayload(await request.json());
  if (Object.keys(errors).length > 0) return fail('Invalid brand data.', 422, errors);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('brands')
    .insert(brand)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'brand.create',
    entity_type: 'brand',
    entity_id: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return ok({ brand: brandToClient(data) }, { status: 201 });
}
