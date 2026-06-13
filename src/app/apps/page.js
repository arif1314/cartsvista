"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Sparkles, 
  Glasses, 
  TrendingUp, 
  Bell, 
  ShieldCheck, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Monitor
} from 'lucide-react';
import styles from './page.module.css';

export default function AppsPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1200);
  };

  return (
    <div className={styles.container}>
      {/* Decorative Glows */}
      <div className={styles.glowTop} />
      <div className={styles.glowRight} />
      <div className={styles.glowLeft} />

      <div className={styles.inner}>
        {/* Top Breadcrumb / Badge */}
        <div className={styles.badgeContainer}>
          <span className={styles.badge}>
            <Sparkles size={14} className={styles.badgeIcon} />
            CartsVista Ecosystem Roadmap
          </span>
        </div>

        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Our Apps <span className={styles.gradientText}>Upcoming</span>
          </h1>
          <p className={styles.heroSubtitle}>
            We are designing the future of commerce. From spatial immersive retail on Apple Vision Pro to hyper-optimized merchant terminals, discover how CartsVista will transcend traditional screens.
          </p>
        </section>

        {/* Apps Cards Showcase */}
        <section className={styles.grid}>
          {/* Card 1: Mobile App */}
          <div className={styles.card}>
            <div className={styles.cardVisual}>
              {/* CSS Phone Mockup */}
              <div className={styles.phoneFrame}>
                <div className={styles.phoneSpeaker} />
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneHeader}>
                    <span className={styles.phoneLogo}>CartsVista</span>
                    <span className={styles.phoneSignal}>5G</span>
                  </div>
                  <div className={styles.phoneContent}>
                    <div className={styles.phoneCard}>
                      <div className={styles.phoneCardImg} />
                      <div className={styles.phoneCardText}>
                        <div className={styles.phoneLineLong} />
                        <div className={styles.phoneLineShort} />
                      </div>
                      <div className={styles.phoneButton}>Buy Now</div>
                    </div>
                  </div>
                  <div className={styles.phoneHomeBar} />
                </div>
              </div>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardType}>
                <Smartphone size={16} />
                <span>iOS & Android</span>
              </div>
              <h2 className={styles.cardTitle}>CartsVista Mobile</h2>
              <p className={styles.cardDescription}>
                The ultimate companion for shopping. Track orders in real-time, get notified of limited drops, and try on products virtually with our advanced AR engines.
              </p>
              <ul className={styles.features}>
                <li>
                  <Zap size={14} /> One-Click Instant Purchase
                </li>
                <li>
                  <Sparkles size={14} /> AR Visual Clothing Try-On
                </li>
                <li>
                  <Bell size={14} /> Custom Drop Notification System
                </li>
              </ul>
              <span className={styles.comingSoon}>Coming Q3 2026</span>
            </div>
          </div>

          {/* Card 2: Vision Pro App */}
          <div className={styles.card}>
            <div className={styles.cardVisual}>
              {/* CSS Apple Vision Pro Mockup */}
              <div className={styles.visionFrame}>
                <div className={styles.visionGlass}>
                  <div className={styles.visionGlow} />
                  <div className={styles.visionLogo}>CV Spatial</div>
                </div>
                <div className={styles.visionStrap} />
                <div className={styles.spatialItemFloat}>
                  <div className={styles.spatialImg} />
                </div>
              </div>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardType}>
                <Glasses size={16} />
                <span>visionOS (Spatial Commerce)</span>
              </div>
              <h2 className={styles.cardTitle}>CartsVista Spatial</h2>
              <p className={styles.cardDescription}>
                Step inside the store. Browse luxury products rendered in photorealistic 3D, inspect fabrics up close, and place custom furniture directly inside your living space before buying.
              </p>
              <ul className={styles.features}>
                <li>
                  <Sparkles size={14} /> Immersive 3D Interactive Showrooms
                </li>
                <li>
                  <Zap size={14} /> Eye-Tracking & Gesture Navigation
                </li>
                <li>
                  <ShieldCheck size={14} /> Spatial Security & Biometrics
                </li>
              </ul>
              <span className={styles.comingSoon}>Coming Q4 2026</span>
            </div>
          </div>

          {/* Card 3: Merchant Dashboard / iPad App */}
          <div className={styles.card}>
            <div className={styles.cardVisual}>
              {/* CSS Tablet/Dashboard Mockup */}
              <div className={styles.tabletFrame}>
                <div className={styles.tabletScreen}>
                  <div className={styles.tabletSidebar}>
                    <div className={styles.tabCircle} />
                    <div className={styles.tabLine} />
                    <div className={styles.tabLine} />
                  </div>
                  <div className={styles.tabletMain}>
                    <div className={styles.tabChartHeader}>
                      <div className={styles.tabTitleText} />
                      <div className={styles.tabStatText} />
                    </div>
                    <div className={styles.tabChart}>
                      <div className={styles.tabBarChart} style={{ height: '40%' }} />
                      <div className={styles.tabBarChart} style={{ height: '70%' }} />
                      <div className={styles.tabBarChart} style={{ height: '90%' }} />
                      <div className={styles.tabBarChart} style={{ height: '55%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardType}>
                <Monitor size={16} />
                <span>iPadOS, macOS & Web</span>
              </div>
              <h2 className={styles.cardTitle}>CartsVista Merchant</h2>
              <p className={styles.cardDescription}>
                Control your retail empire from anywhere. Review stock trends, run live promotions, converse with clients via integrated AI chat, and manage delivery chains in real time.
              </p>
              <ul className={styles.features}>
                <li>
                  <TrendingUp size={14} /> Predictive Demand Forecasting
                </li>
                <li>
                  <Zap size={14} /> Instantly Sync with Offline Channels
                </li>
                <li>
                  <ShieldCheck size={14} /> Role-Based Employee Terminals
                </li>
              </ul>
              <span className={styles.comingSoon}>Coming Q3 2026</span>
            </div>
          </div>
        </section>

        {/* Call to Action: Join Beta */}
        <section className={styles.cta}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Be the First to Experience</h2>
              <p className={styles.ctaSubtitle}>
                Join our exclusive beta program. Test early builds of CartsVista apps on iOS TestFlight, Android Developer Hub, and visionOS simulator.
              </p>
              
              {status === 'success' ? (
                <div className={styles.successMessage}>
                  <CheckCircle size={24} className={styles.successIcon} />
                  <div>
                    <h3 className={styles.successTitle}>You're on the list!</h3>
                    <p className={styles.successText}>We have reserved your spot. Watch your inbox for TestFlight and Android Beta invitations soon.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <input 
                    type="email" 
                    placeholder="Enter your corporate or personal email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles.input}
                    disabled={status === 'loading'}
                  />
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? (
                      <span className={styles.spinner} />
                    ) : (
                      <>
                        Request Beta Access
                        <ArrowRight size={16} className={styles.submitIcon} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Back to Home Link */}
        <div className={styles.backHome}>
          <Link href="/">
            ← Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
