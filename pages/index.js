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
        <title>NovaP2P - Crypto P2P Marketplace</title>
        <meta name="description" content="A futuristic crypto P2P marketplace" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>NovaP2P</div>
        <nav className={styles.nav}>
          <a href="#markets" className={styles.navLink}>Markets</a>
          <Link href="/p2p" className={styles.navLink}>P2P</Link>
          <a href="#trade" className={styles.navLink}>Trade</a>
          <a href="#about" className={styles.navLink}>About</a>
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
              <a href="#learn" className={styles.secondaryButton}>
                <span className={styles.btnText}>Learn More</span>
              </a>
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

        <section id="features" className={styles.features}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionAccent}></div>
            <h2 className={styles.sectionTitle}>Why Choose <span className={styles.highlight}>NovaP2P</span>?</h2>
            <p className={styles.sectionSubtitle}>Experience the advantages of our next-generation trading platform</p>
          </div>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              </div>
              <h3 className={styles.featureTitle}>Secure Transactions</h3>
              <p className={styles.featureDescription}>Advanced encryption and multi-signature wallets provide bank-grade security for all your transactions.</p>
              <div className={styles.featureHover}></div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="13" y1="2" x2="13" y2="22"></line>
                    <polyline points="19 8 13 2 7 8"></polyline>
                    <line x1="11" y1="22" x2="11" y2="2"></line>
                    <polyline points="5 16 11 22 17 16"></polyline>
                  </svg>
                </div>
              </div>
              <h3 className={styles.featureTitle}>Lightning Fast</h3>
              <p className={styles.featureDescription}>Complete transactions in seconds with our optimized blockchain integration and efficient matching engine.</p>
              <div className={styles.featureHover}></div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
              </div>
              <h3 className={styles.featureTitle}>Low Fees</h3>
              <p className={styles.featureDescription}>Our competitive fee structure ensures you keep more of your profits with every trade you make.</p>
              <div className={styles.featureHover}></div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
              </div>
              <h3 className={styles.featureTitle}>Global Access</h3>
              <p className={styles.featureDescription}>Trade with users from over 120 countries with support for multiple payment methods and currencies.</p>
              <div className={styles.featureHover}></div>
            </div>
          </div>
          
          <div className={styles.featureCallout}>
            <div className={styles.calloutContent}>
              <h3>Ready to start trading?</h3>
              <p>Join thousands of traders worldwide on NovaP2P</p>
            </div>
            <Link href="/auth" className={styles.calloutButton}>
              Create Account
            </Link>
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
