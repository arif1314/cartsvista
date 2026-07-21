import { notFound } from 'next/navigation';
import { footerPagesData } from '@/data/footerPagesData';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/site/url';
import styles from './page.module.css';

function plainText(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Pre-render all known footer pages
export function generateStaticParams() {
  return Object.keys(footerPagesData).map((slug) => ({
    slug: slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const pageData = footerPagesData[slug];
  if (!pageData) return { title: 'Page Not Found', robots: { index: false, follow: false } };

  const description = plainText(pageData.content).slice(0, 160);
  const canonical = `/pages/${slug}`;
  return {
    title: pageData.title,
    description,
    alternates: { canonical },
    openGraph: { type: 'article', url: canonical, title: pageData.title, description },
    twitter: { card: 'summary', title: pageData.title, description },
  };
}

export default async function FooterPage({ params }) {
  const { slug } = await params;
  const pageData = footerPagesData[slug];

  if (!pageData) {
    return notFound();
  }

  // Generate a sidebar of related links
  const allSlugs = Object.keys(footerPagesData);
  const canonicalUrl = absoluteUrl(`/pages/${slug}`);
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: pageData.title, item: canonicalUrl },
    ],
  };

  return (
    <div className={styles.pageContainer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }}
      />
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> <span className={styles.separator}>/</span> 
          <span className={styles.current}>{pageData.title}</span>
        </div>
        <h1 className={styles.pageTitle}>{pageData.title}</h1>
      </div>

      <div className={styles.contentLayout}>
        <aside className={styles.sidebar}>
          <h3>Information</h3>
          <ul className={styles.sidebarList}>
            {allSlugs.map(s => (
              <li key={s} className={s === slug ? styles.active : ''}>
                <Link href={`/pages/${s}`}>
                  {footerPagesData[s].title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.mainContent}>
          <div 
            className={styles.richText}
            dangerouslySetInnerHTML={{ __html: pageData.content }}
          />
        </main>
      </div>
    </div>
  );
}
