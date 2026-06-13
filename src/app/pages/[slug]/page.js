import { notFound } from 'next/navigation';
import { footerPagesData } from '@/data/footerPagesData';
import Link from 'next/link';
import styles from './page.module.css';

// Pre-render all known footer pages
export function generateStaticParams() {
  return Object.keys(footerPagesData).map((slug) => ({
    slug: slug,
  }));
}

export default async function FooterPage({ params }) {
  const { slug } = await params;
  const pageData = footerPagesData[slug];

  if (!pageData) {
    return notFound();
  }

  // Generate a sidebar of related links
  const allSlugs = Object.keys(footerPagesData);

  return (
    <div className={styles.pageContainer}>
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
