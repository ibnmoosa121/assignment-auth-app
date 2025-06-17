import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import { supabase } from '../utils/supabaseClient';

export default function DepositorPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [verifiedAccounts, setVerifiedAccounts] = useState({});
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
        // Check if user is a depositor
        const userMetadata = sessionUser.user_metadata;
        if (userMetadata?.role !== 'depositor') {
          // If not a depositor, redirect to P2P page
          router.push('/p2p');
        } else {
          setIsLoading(false);
          // Accounts will be loaded via useEffect
        }
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
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  // Load accounts assigned to this depositor
  useEffect(() => {
    const loadDepositorAccounts = async () => {
      if (!user || isLoading) return;
      
      try {
        await ensureAccountsTableExists();
        
        // Fetch accounts assigned to this depositor
        const { data: accountsData, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('depositorId', user.id);
        
        if (error) {
          console.error('Error fetching accounts:', error);
          return;
        }
        
        setAccounts(accountsData || []);
        
        // Initialize verification status from fetched data
        const verificationStatus = {};
        accountsData?.forEach(account => {
          verificationStatus[account.id] = account.verified || false;
        });
        setVerifiedAccounts(verificationStatus);
      } catch (error) {
        console.error('Error in loadDepositorAccounts:', error);
      }
    };
    
    loadDepositorAccounts();
    
    // Set up real-time subscription to accounts table
    const subscription = supabase
      .channel('accounts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'accounts', filter: `depositorId=eq.${user?.id}` }, 
        payload => {
          console.log('Real-time update received:', payload);
          
          // Reload accounts when there's any change
          loadDepositorAccounts();
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [user, isLoading]);
  
  // Ensure the accounts table exists in Supabase
  const ensureAccountsTableExists = async () => {
    try {
      // Check if the table exists by attempting to query it
      const { error } = await supabase
        .from('accounts')
        .select('count')
        .limit(1);
      
      // If there's no error, the table exists
      if (!error) return;
      
      // If there's an error and it's not a "relation does not exist" error,
      // we can't do much here in the client
      console.log('Note: You may need to create the accounts table in Supabase');
      
      // For demo purposes, we'll populate with mock data if no accounts exist
      const mockAccounts = [
        {
          id: '1',
          amount: 50000,
          ifsc: 'SBIN0001234',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          bankName: 'State Bank of India',
          upiId: 'johndoe@sbi',
          date: new Date().toISOString().split('T')[0],
          depositorId: user?.id,
          verified: false
        },
        {
          id: '2',
          amount: 75000,
          ifsc: 'HDFC0002345',
          accountNumber: '2345678901',
          accountName: 'Jane Smith',
          bankName: 'HDFC Bank',
          upiId: 'janesmith@hdfc',
          date: new Date().toISOString().split('T')[0],
          depositorId: user?.id,
          verified: false
        }
      ];
      
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Error checking accounts table:', error);
    }
  };

  // Handle verification toggle
  const handleVerificationToggle = async (accountId) => {
    try {
      // Get the current verification status
      const currentStatus = verifiedAccounts[accountId] || false;
      const newStatus = !currentStatus;
      
      // Update local state first for immediate UI feedback
      const newVerifiedAccounts = { ...verifiedAccounts };
      newVerifiedAccounts[accountId] = newStatus;
      setVerifiedAccounts(newVerifiedAccounts);
      
      // Update the account in Supabase
      const { error } = await supabase
        .from('accounts')
        .update({ verified: newStatus })
        .eq('id', accountId);
      
      if (error) {
        console.error('Error updating verification status:', error);
        // Revert the local state if the update failed
        newVerifiedAccounts[accountId] = currentStatus;
        setVerifiedAccounts(newVerifiedAccounts);
        alert('Failed to update verification status. Please try again.');
        return;
      }
      
      // Show confirmation alert
      const status = newStatus ? 'verified' : 'unverified';
      alert(`Account ${accountId} marked as ${status}`);
      
      // Update the accounts list to reflect the new status
      setAccounts(accounts.map(account => {
        if (account.id === accountId) {
          return { ...account, verified: newStatus };
        }
        return account;
      }));
    } catch (error) {
      console.error('Error in handleVerificationToggle:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Format currency in Indian format
  const formatIndianCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Depositor Dashboard - NovaP2P</title>
        <meta name="description" content="NovaP2P Depositor Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>NovaP2P</div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/depositor" className={`${styles.navLink} ${styles.active}`}>
            Depositor
          </Link>
        </nav>
        <div className={styles.userSection}>
          <span className={styles.username}>{user?.user_metadata?.username || user?.email}</span>
          <button onClick={handleSignOut} className={styles.signOutBtn}>Sign Out</button>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title} style={{ marginBottom: '0.5rem' }}>Depositor Dashboard</h1>
        
        <div className={styles.depositorContainer}>
          <div className={styles.tableSection}>
            <h2>Your Assigned Accounts</h2>
            <div className={styles.tableWrapper}>
              {accounts.length > 0 ? (
                <table className={styles.accountsTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Bank Name</th>
                      <th>Account Name</th>
                      <th>Account Number</th>
                      <th>IFSC</th>
                      <th>UPI ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className={verifiedAccounts[account.id] ? styles.verifiedRow : ''}>
                        <td>{account.date}</td>
                        <td>{formatIndianCurrency(account.amount)}</td>
                        <td>{account.bankName}</td>
                        <td>{account.accountName}</td>
                        <td>{account.accountNumber}</td>
                        <td>{account.ifsc}</td>
                        <td>{account.upiId}</td>
                        <td>
                          <label className={styles.checkboxContainer}>
                            <input
                              type="checkbox"
                              checked={verifiedAccounts[account.id] || false}
                              onChange={() => handleVerificationToggle(account.id)}
                            />
                            <span className={styles.checkmark}></span>
                            {verifiedAccounts[account.id] ? 'Verified' : 'Pending'}
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <p>No accounts assigned to you yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} NovaP2P. All rights reserved.</p>
      </footer>
    </div>
  );
}
