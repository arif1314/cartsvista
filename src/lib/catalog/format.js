export function categoryToClient(category, children = []) {
  return {
    id: category.id,
    parentId: category.parent_id || '',
    name: category.name,
    title: category.name,
    slug: category.slug,
    description: category.description || '',
    isActive: Boolean(category.is_active),
    sortOrder: Number(category.sort_order || 0),
    collections: children.map((child) => child.name),
    children: children.map((child) => ({
      id: child.id,
      parentId: child.parent_id || '',
      name: child.name,
      title: child.name,
      slug: child.slug,
      description: child.description || '',
      isActive: Boolean(child.is_active),
      sortOrder: Number(child.sort_order || 0),
    })),
  };
}

export function categoriesToNavigation(categories = []) {
  const childrenByParent = categories.reduce((map, category) => {
    if (!category.parent_id) return map;
    const children = map.get(category.parent_id) || [];
    children.push(category);
    map.set(category.parent_id, children);
    return map;
  }, new Map());

  return categories
    .filter((category) => !category.parent_id)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((category) => categoryToClient(
      category,
      (childrenByParent.get(category.id) || [])
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    ));
}

export function brandToClient(brand) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logo_url || '',
    isActive: Boolean(brand.is_active),
    createdAt: brand.created_at,
  };
}
