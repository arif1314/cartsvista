"use client";

import { use } from 'react';
import { useBlogs } from '@/context/BlogContext';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, ArrowRight, ShoppingBag } from 'lucide-react';
import styles from './page.module.css';

export default function BlogDetailPage({ params }) {
  const { slug } = use(params);
  const { articles, isLoaded } = useBlogs();

  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>Loading Article...</div>
      </div>
    );
  }

  const article = articles.find(art => art.slug === slug);

  if (!article) {
    return notFound();
  }

  return (
    <article className={styles.articleContainer}>
      {/* Back Navigation */}
      <div className={styles.backNav}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      {/* Hero Header */}
      <header className={styles.header}>
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <Calendar size={14} />
            {article.date}
          </span>
          <span className={styles.metaDivider}>•</span>
          <span className={styles.metaItem}>
            <Clock size={14} />
            {article.readingTime}
          </span>
        </div>
        <h1 className={styles.title}>{article.title}</h1>
        <p className={styles.summary}>{article.summary}</p>
      </header>

      {/* Feature Cover Image */}
      <div className={styles.coverWrapper}>
        <img src={article.coverImage} alt={article.title} className={styles.coverImage} />
      </div>

      {/* Article Content Layout */}
      <div className={styles.contentLayout}>
        <main className={styles.mainContent}>
          <div 
            className={styles.richText}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </main>
      </div>

      {/* Shopping CTA Banner */}
      {article.link && (
        <section className={styles.shoppingCTA}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaInfo}>
              <span className={styles.ctaTag}>Shop the look</span>
              <h2>Inspired by this story?</h2>
              <p>Explore the exclusive collection featured in this styling guide and find your next premium piece.</p>
            </div>
            <Link href={article.link} className={styles.ctaBtn}>
              <ShoppingBag size={18} />
              Explore Collection
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
