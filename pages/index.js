import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { supabase } from './supabaseClient';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>NovaP2P - Crypto P2P Marketplace</title>
        <meta name="description" content="A futuristic crypto P2P marketplace" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>NovaP2P</div>
        <nav className={styles.nav}>
          <a href="#markets" className={styles.navLink}>Markets</a>
          <a href="#trade" className={styles.navLink}>Trade</a>
          <a href="#about" className={styles.navLink}>About</a>
        </nav>
        <div className={styles.auth}>
          {user ? (
            <div className={styles.userSection}>
              <span className={styles.userEmail}>{user.email}</span>
              <button onClick={handleSignOut} className={styles.signOutBtn}>Sign Out</button>
            </div>
          ) : (
            <Link href="/auth" className={styles.authButton}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>The Future of <span className={styles.highlight}>Crypto Trading</span></h1>
            <p className={styles.subtitle}>
              Secure, Fast, and Decentralized P2P Trading Platform
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/auth" className={styles.primaryButton}>
                Start Trading
              </Link>
              <a href="#learn" className={styles.secondaryButton}>
                Learn More
              </a>
            </div>
          </div>
          <div className={styles.heroImage}>
            {/* This would be a crypto-related image or animation */}
            <div className={styles.cryptoOrb}></div>
          </div>
        </section>

        <section id="features" className={styles.features}>
          <h2 className={styles.sectionTitle}>Why Choose NovaP2P?</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>Secure Transactions</h3>
              <p>Advanced encryption and multi-signature wallets for maximum security.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3>Lightning Fast</h3>
              <p>Complete transactions in seconds, not minutes or hours.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💰</div>
              <h3>Low Fees</h3>
              <p>Competitive fee structure that keeps more money in your wallet.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌐</div>
              <h3>Global Access</h3>
              <p>Trade with users from around the world with multiple payment options.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>NovaP2P</div>
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#careers">Careers</a>
              <a href="#press">Press</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Products</h4>
              <a href="#exchange">Exchange</a>
              <a href="#wallet">Wallet</a>
              <a href="#card">Card</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact Us</a>
              <a href="#status">System Status</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <a href="#terms">Terms</a>
              <a href="#privacy">Privacy</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} NovaP2P. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
