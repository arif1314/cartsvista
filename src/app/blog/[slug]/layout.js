import { cache } from 'react';
import { absoluteUrl } from '@/lib/site/url';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const getArticle = cache(async (slug) => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('articles')
    .select('title,slug,summary,content,cover_image,created_at,updated_at,reading_time')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  return data || null;
});

function readableSlug(slug) {
  return String(slug || '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function articleDescription(article, slug) {
  return String(article?.summary || article?.content || `Read ${readableSlug(slug)} from the CartsVista editorial team.`)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  const title = article?.title || readableSlug(slug);
  const description = articleDescription(article, slug);
  const canonical = `/blog/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      publishedTime: article?.created_at,
      modifiedTime: article?.updated_at || article?.created_at,
      images: article?.cover_image ? [{ url: article.cover_image, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article?.cover_image ? [article.cover_image] : [],
    },
  };
}

export default async function BlogLayout({ children, params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return children;

  const canonicalUrl = absoluteUrl(`/blog/${slug}`);
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      headline: article.title,
      description: articleDescription(article, slug),
      image: article.cover_image ? [article.cover_image] : [],
      datePublished: article.created_at,
      dateModified: article.updated_at || article.created_at,
      mainEntityOfPage: canonicalUrl,
      author: { '@type': 'Organization', name: 'CartsVista Editorial', url: absoluteUrl('/') },
      publisher: { '@id': `${absoluteUrl('/')}#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Editorial', item: absoluteUrl('/#editorial') },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, '\\u003c') }}
      />
      {children}
    </>
  );
}
