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
  const [userInfo, setUserInfo] = useState({
    id: '',
    email: '',
    role: ''
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
          account_number: '1234567890',
          account_name: 'John Doe',
          bank_name: 'State Bank of India',
          upi_id: 'johndoe@sbi',
          date: new Date().toISOString().split('T')[0],
          depositor_id: user?.id,
          verified: false
        },
        {
          id: '2',
          amount: 75000,
          ifsc: 'HDFC0002345',
          account_number: '2345678901',
          account_name: 'Jane Smith',
          bank_name: 'HDFC Bank',
          upi_id: 'janesmith@hdfc',
          date: new Date().toISOString().split('T')[0],
          depositor_id: user?.id,
          verified: false
        }
      ];
      
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Error checking accounts table:', error);
    }
  };

  // Load accounts assigned to this depositor
  useEffect(() => {
    const loadDepositorAccounts = async () => {
      if (!user || isLoading) return;
      
      try {
        await ensureAccountsTableExists();
        
        console.log('Current user ID:', user.id);
        
        // Set user info for display
        setUserInfo({
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'depositor'
        });
        
        // Fetch accounts assigned to this depositor
        // First try to get accounts specifically assigned to this user's ID
        const { data: userAccounts, error: userError } = await supabase
          .from('accounts')
          .select('*')
          .eq('depositor_id', user.id);
        
        if (userError) {
          console.error('Error fetching user accounts:', userError);
        } else {
          console.log('User-specific accounts:', userAccounts);
        }
        
        // Try to get accounts with email-based depositor IDs
        // This will find accounts assigned to any email address
        const { data: emailAccounts, error: emailError } = await supabase
          .from('accounts')
          .select('*')
          .ilike('depositor_id', '%@%'); // Simple check for email-like IDs
        
        if (emailError) {
          console.error('Error fetching email accounts:', emailError);
        } else {
          console.log('Email-based depositor accounts:', emailAccounts);
        }
        
        // Specifically check for the Mohammed Khurram email
        const { data: specificEmailAccounts, error: specificEmailError } = await supabase
          .from('accounts')
          .select('*')
          .eq('depositor_id', 'mohammedkhurram14.mk@gmail.com');
        
        if (specificEmailError) {
          console.error('Error fetching specific email accounts:', specificEmailError);
        } else {
          console.log('Mohammed Khurram accounts:', specificEmailAccounts);
        }
        
        // Combine all sets of accounts, removing duplicates
        const allAccounts = [
          ...(userAccounts || []),
          ...((emailAccounts || []).filter(emailAcc => 
            !(userAccounts || []).some(userAcc => userAcc.id === emailAcc.id)
          )),
          ...((specificEmailAccounts || []).filter(specificAcc => 
            !(userAccounts || []).some(userAcc => userAcc.id === specificAcc.id) &&
            !(emailAccounts || []).some(emailAcc => emailAcc.id === specificAcc.id)
          ))
        ];
        
        setAccounts(allAccounts);
        console.log('All accounts loaded:', allAccounts);
        
        // Initialize verification status from fetched data
        const verificationStatus = {};
        allAccounts?.forEach(account => {
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
        { event: '*', schema: 'public', table: 'accounts' }, // Remove filter to catch all changes
        payload => {
          console.log('Real-time update received:', payload);
          
          // Check if this update is relevant to the current user or any email-based depositor
          const isRelevant = 
            // Current user's ID
            payload.new?.depositor_id === user?.id || 
            payload.old?.depositor_id === user?.id || 
            // Email-based depositor IDs (simple check for '@' character)
            (payload.new?.depositor_id && payload.new.depositor_id.includes('@')) || 
            (payload.old?.depositor_id && payload.old.depositor_id.includes('@')) || 
            // Specific email we're interested in
            payload.new?.depositor_id === 'mohammedkhurram14.mk@gmail.com' || 
            payload.old?.depositor_id === 'mohammedkhurram14.mk@gmail.com';
          
          if (isRelevant) {
            console.log('Relevant update, reloading accounts');
            // Reload accounts when there's a relevant change
            loadDepositorAccounts();
          }
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [user, isLoading, ensureAccountsTableExists]);

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
        
        {/* User Information Section */}
        <div className={styles.userInfoSection} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>Current User Information</h3>
          <p><strong>Email:</strong> {userInfo.email || 'Not available'}</p>
          <p><strong>User ID:</strong> {userInfo.id || 'Not available'}</p>
          <p><strong>Role:</strong> {userInfo.role || 'Not available'}</p>
          <p><strong>Note:</strong> You should see accounts assigned to your user ID or to email-based depositors</p>
        </div>
        
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
                        <td>{account.bank_name}</td>
                        <td>{account.account_name}</td>
                        <td>{account.account_number}</td>
                        <td>{account.ifsc}</td>
                        <td>{account.upi_id}</td>
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
