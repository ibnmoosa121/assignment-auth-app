import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import { supabase } from '../utils/supabaseClient';

export default function P2PPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    ifsc: '',
    accountNumber: '',
    accountName: '',
    bankName: '',
    upiId: ''
  });
  const router = useRouter();

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      
      // If no user is logged in, redirect to auth page
      if (!sessionUser) {
        router.push('/auth');
      } else {
        setIsLoading(false);
      }
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        // If user signs out, redirect to auth page
        if (!currentUser) {
          router.push('/auth');
        }
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    alert('Form submitted successfully!');
    console.log('Form data:', formData);
    
    // Reset form after submission
    setFormData({
      amount: '',
      ifsc: '',
      accountNumber: '',
      accountName: '',
      bankName: '',
      upiId: ''
    });
  };

  // Show loading state or redirect if not authenticated
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>P2P Transactions - NovaP2P</title>
        <meta name="description" content="P2P transaction page for NovaP2P" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>NovaP2P</div>
        <nav className={styles.nav}>
          <Link href="/#markets" className={styles.navLink}>Markets</Link>
          <Link href="/p2p" className={`${styles.navLink} ${styles.activeLink}`}>P2P</Link>
          <Link href="/#trade" className={styles.navLink}>Trade</Link>
          <Link href="/#about" className={styles.navLink}>About</Link>
        </nav>
        <div className={styles.auth}>
          {user && (
            <div className={styles.userSection}>
              <span className={styles.userEmail}>{user.user_metadata?.username || user.email}</span>
              <button onClick={handleSignOut} className={styles.signOutBtn}>Sign Out</button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>P2P Transaction</h1>
        
        <div className={styles.p2pFormContainer}>
          <form onSubmit={handleSubmit} className={styles.p2pForm}>
            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount (INR)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="bankName">Bank Name</label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="Enter bank name"
                required
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="ifsc">IFSC Code</label>
              <input
                type="text"
                id="ifsc"
                name="ifsc"
                value={formData.ifsc}
                onChange={handleChange}
                placeholder="Enter IFSC code"
                required
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="accountNumber">Account Number</label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="Enter account number"
                required
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="accountName">Account Holder Name</label>
              <input
                type="text"
                id="accountName"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                placeholder="Enter account holder name"
                required
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="upiId">UPI ID (Optional)</label>
              <input
                type="text"
                id="upiId"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="Enter UPI ID (optional)"
                className={styles.formInput}
              />
            </div>
            
            <button type="submit" className={styles.submitButton}>
              Submit Transaction
            </button>
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 NovaP2P. All rights reserved.</p>
      </footer>
    </div>
  );
}
