import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { supabase } from '../utils/supabaseClient';

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
        <title>TGP2P - Crypto P2P Marketplace</title>
        <meta name="description" content="A futuristic crypto P2P marketplace" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>TGP2P</div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/p2p" className={styles.navLink}>P2P</Link>
        </nav>
        <div className={styles.auth}>
          {user ? (
            <div className={styles.userSection}>
              <span className={styles.userEmail}>{user.user_metadata?.username || user.email}</span>
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
        <div className={styles.particles}></div>
        
        <section className={styles.hero}>
          <div className={styles.heroGlow}></div>
          <div className={styles.heroContent}>
            <div className={styles.tagline}>Revolutionary Crypto Exchange</div>
            <h1 className={styles.title}>
              <span className={styles.titleLine}>Trade Crypto</span>
              <span className={styles.titleLine}>With <span className={styles.highlight}>Confidence</span></span>
            </h1>
            <p className={styles.subtitle}>
              Experience the next generation of secure, fast, and decentralized P2P trading
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/auth" className={styles.primaryButton}>
                <span className={styles.btnText}>Start Trading</span>
                <span className={styles.btnIcon}>→</span>
              </Link>
              <Link href="/p2p" className={styles.secondaryButton}>
                <span className={styles.btnText}>Go to P2P</span>
              </Link>
            </div>
            
            <div className={styles.statsContainer}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>$2.4B+</span>
                <span className={styles.statLabel}>Trading Volume</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>120+</span>
                <span className={styles.statLabel}>Countries</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>2M+</span>
                <span className={styles.statLabel}>Users</span>
              </div>
            </div>
          </div>
          
          <div className={styles.heroVisual}>
            <div className={styles.orbContainer}>
              <div className={styles.cryptoOrb}>
                <div className={styles.orbCore}></div>
                <div className={styles.orbRing1}></div>
                <div className={styles.orbRing2}></div>
                <div className={styles.orbRing3}></div>
              </div>
              <div className={styles.floatingCoins}>
                <div className={`${styles.floatingCoin} ${styles.coin1}`}>₿</div>
                <div className={`${styles.floatingCoin} ${styles.coin2}`}>Ξ</div>
                <div className={`${styles.floatingCoin} ${styles.coin3}`}>Ł</div>
                <div className={`${styles.floatingCoin} ${styles.coin4}`}>Ð</div>
              </div>
            </div>
            <div className={styles.glowingLines}></div>
          </div>
        </section>
      </main>
    </div>
  );
}
