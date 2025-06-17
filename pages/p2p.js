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
    upiId: '',
    depositorId: ''
  });
  const [depositors, setDepositors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({});
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
        
        if (userMetadata?.role === 'depositor') {
          // If user is a depositor, redirect to depositor page
          router.push('/depositor');
        } else {
          setIsLoading(false);
        }
      }
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (!currentUser) {
          // If user signs out, redirect to auth page
          router.push('/auth');
        } else {
          // Check if user is a depositor
          const userMetadata = currentUser.user_metadata;
          if (userMetadata?.role === 'depositor') {
            // If user is a depositor, redirect to depositor page
            router.push('/depositor');
          }
        }
      }
    );
    
    return () => {
      authListener?.subscription?.unsubscribe();
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
    
    // Validate depositor selection
    if (!formData.depositorId) {
      alert('Please select a depositor for this account.');
      return;
    }
    
    try {
      // Create a new account with current form data
      const newAccount = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        verified: false, // Initial verification status
        created_by: user?.id // Track who created this account
      };
      
      // Ensure the accounts table exists
      await ensureAccountsTableExists();
      
      // Save the account to Supabase
      const { data, error } = await supabase
        .from('accounts')
        .insert([newAccount])
        .select();
      
      if (error) {
        console.error('Error adding account:', error);
        alert(`Failed to add account: ${error.message}`);
        return;
      }
      
      // Add the new account to the local accounts list
      const savedAccount = data[0];
      setAccounts([...accounts, savedAccount]);
      
      // Reset the form
      setFormData({
        amount: '',
        ifsc: '',
        accountNumber: '',
        accountName: '',
        bankName: '',
        upiId: '',
        depositorId: ''
      });
      
      // Show success message
      alert('Account added successfully!');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('An error occurred while adding the account. Please try again.');
    }
  };

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
    } catch (error) {
      console.error('Error checking accounts table:', error);
    }
  };

  // Load accounts and calculate daily totals
  useEffect(() => {
    const loadAccounts = async () => {
      if (isLoading || !user) return;
      
      try {
        await ensureAccountsTableExists();
        
        // Fetch all accounts (not just created by this user)
        // This allows Order Givers to see all accounts in the system
        const { data: accountsData, error } = await supabase
          .from('accounts')
          .select('*');
        
        if (error) {
          console.error('Error fetching accounts:', error);
          return;
        }
        
        setAccounts(accountsData || []);
        
        // Calculate daily totals
        const totals = {};
        accountsData?.forEach(account => {
          const date = account.date;
          if (!totals[date]) {
            totals[date] = 0;
          }
          totals[date] += account.amount;
        });
        setDailyTotals(totals);
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };
    
    loadAccounts();
    
    // Set up real-time subscription to accounts table
    const subscription = supabase
      .channel('accounts-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'accounts' }, 
        payload => {
          console.log('Real-time update received:', payload);
          
          // Reload all accounts when there's any change
          loadAccounts();
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [isLoading, user]);

  // Load depositors from Supabase
  useEffect(() => {
    const loadDepositors = async () => {
      if (isLoading || !user) return;
      
      try {
        // Fetch users with 'depositor' role
        const { data: depositorUsers, error } = await supabase
          .from('users')
          .select('id, username, user_metadata')
          .eq('user_metadata->>role', 'depositor');
        
        if (error) {
          console.error('Error fetching depositors:', error);
          // Fall back to mock data if there's an error
          const mockDepositors = [
            { id: 'dep1', name: 'Depositor 1' },
            { id: 'dep2', name: 'Depositor 2' },
            { id: 'dep3', name: 'Depositor 3' }
          ];
          setDepositors(mockDepositors);
          return;
        }
        
        // If no depositors found or error with the query, use mock data
        if (!depositorUsers || depositorUsers.length === 0) {
          const mockDepositors = [
            { id: 'dep1', name: 'Depositor 1' },
            { id: 'dep2', name: 'Depositor 2' },
            { id: 'dep3', name: 'Depositor 3' }
          ];
          setDepositors(mockDepositors);
        } else {
          // Format the depositors for the dropdown
          const formattedDepositors = depositorUsers.map(user => ({
            id: user.id,
            name: user.username || user.user_metadata?.username || `Depositor ${user.id.substring(0, 4)}`
          }));
          setDepositors(formattedDepositors);
        }
      } catch (error) {
        console.error('Error loading depositors:', error);
        // Fall back to mock data
        const mockDepositors = [
          { id: 'dep1', name: 'Depositor 1' },
          { id: 'dep2', name: 'Depositor 2' },
          { id: 'dep3', name: 'Depositor 3' }
        ];
        setDepositors(mockDepositors);
      }
    };
    
    loadDepositors();
  }, [isLoading, user]);

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
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/p2p" className={`${styles.navLink} ${styles.activeLink}`}>P2P</Link>
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
        <h1 className={styles.title} style={{ marginBottom: '0.5rem' }}>P2P Transaction</h1>
        
        <div className={styles.p2pPageLayout}>
          <div className={styles.p2pFormContainer}>
            <h2 className={styles.sectionTitle}>Add New Account</h2>
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
              
              <div className={styles.formGroup}>
                <label htmlFor="depositorId">Assign to Depositor</label>
                <select
                  id="depositorId"
                  name="depositorId"
                  value={formData.depositorId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a depositor</option>
                  {depositors.map(depositor => (
                    <option key={depositor.id} value={depositor.id}>
                      {depositor.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className={styles.submitButton}>
                Add Account
              </button>
            </form>
          </div>
          
          <div className={styles.accountsTableContainer}>
            <h2 className={styles.sectionTitle}>Account Details</h2>
            
            {accounts.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.accountsTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Account Name</th>
                      <th>Bank Name</th>
                      <th>Account Number</th>
                      <th>IFSC</th>
                      <th>Amount (INR)</th>
                      <th>UPI ID</th>
                      <th>Depositor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className={account.verified ? styles.verifiedRow : ''}>
                        <td>{account.date}</td>
                        <td>{account.accountName}</td>
                        <td>{account.bankName}</td>
                        <td>{account.accountNumber}</td>
                        <td>{account.ifsc}</td>
                        <td className={styles.amountCell}>{parseFloat(account.amount).toLocaleString('en-IN')}</td>
                        <td>{account.upiId || '-'}</td>
                        <td>
                          {depositors.find(d => d.id === account.depositorId)?.name || '-'}
                        </td>
                        <td>
                          {account.verified ? 'Verified' : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.noDataMessage}>No accounts added yet.</p>
            )}
            
            {Object.keys(dailyTotals).length > 0 && (
              <div className={styles.dailyTotalsSection}>
                <h3 className={styles.sectionSubtitle}>Daily Totals</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.totalsTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Total Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(dailyTotals).map(([date, total]) => (
                        <tr key={date}>
                          <td>{date}</td>
                          <td className={styles.amountCell}>{total.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 NovaP2P. All rights reserved.</p>
      </footer>
    </div>
  );
}
