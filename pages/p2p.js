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
    account_number: '',  // Changed from accountNumber to account_number
    account_name: '',    // Changed from accountName to account_name
    bank_name: '',       // Changed from bankName to bank_name
    upi_id: '',          // Changed from upiId to upi_id
    depositor_id: ''     // Changed from depositorId to depositor_id
  });
  const [userInfo, setUserInfo] = useState({
    id: '',
    email: '',
    role: ''
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
    if (!formData.depositor_id) {
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
      const tableExists = await ensureAccountsTableExists();
      
      if (!tableExists) {
        alert('The accounts table does not exist in your Supabase database. Please create it first.');
        console.log('Please create the accounts table in your Supabase dashboard with the columns shown in the console.');
        return;
      }
      
      // Log the account being created for debugging
      console.log('Creating account:', newAccount);
      
      // Save the account to Supabase
      const { data, error } = await supabase
        .from('accounts')
        .insert([newAccount])
        .select();
      
      if (error) {
        console.error('Error adding account:', error);
        alert(`Failed to add account: ${error.message || JSON.stringify(error)}`);
        return;
      }
      
      // Add the new account to the local accounts list
      const savedAccount = data[0];
      setAccounts([...accounts, savedAccount]);
      
      // Reset the form
      setFormData({
        amount: '',
        ifsc: '',
        account_number: '',
        account_name: '',
        bank_name: '',
        upi_id: '',
        depositor_id: ''
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
      if (!error) {
        console.log('Accounts table exists in Supabase');
        return true;
      }
      
      // If there's an error, log detailed information
      console.error('Error checking accounts table:', error);
      console.log('You need to create the accounts table in Supabase with these columns:');
      console.log('- id: uuid (primary key, default: uuid_generate_v4())');
      console.log('- amount: float8 (not null)');
      console.log('- ifsc: text (not null)');
      console.log('- account_number: text (not null)');
      console.log('- account_name: text (not null)');
      console.log('- bank_name: text (not null)');
      console.log('- upi_id: text');
      console.log('- date: date (not null)');
      console.log('- depositor_id: uuid (not null)');
      console.log('- verified: boolean (default: false)');
      console.log('- created_by: uuid');
      return false;
    } catch (error) {
      console.error('Error checking accounts table:', error);
      return false;
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

  // Load depositors from Supabase Auth
  useEffect(() => {
    const loadDepositors = async () => {
      if (isLoading || !user) return;
      
      try {
        // Get the current user's information
        const { data: currentUser } = await supabase.auth.getUser();
        console.log('Current user:', currentUser?.user);
        
        // Get the user ID and email from the current session
        const userId = currentUser?.user?.id;
        const userEmail = currentUser?.user?.email;
        
        // Display user info in the UI
        setUserInfo({
          id: userId,
          email: userEmail,
          role: currentUser?.user?.user_metadata?.role || 'order_giver'
        });
        
        // Create a map to store all depositor users
        const depositorMap = {};
        
        // Try to fetch users with depositor role from Supabase Auth
        // Note: This requires admin privileges and might not work from client-side
        // We'll use a different approach to get real users
        
        // Fetch all existing accounts to get unique depositor IDs
        const { data: existingAccounts, error: accountsError } = await supabase
          .from('accounts')
          .select('depositor_id, account_name')
          .order('created_at', { ascending: false });
          
        if (accountsError) {
          console.error('Error fetching existing accounts:', accountsError);
        } else {
          console.log('Existing accounts:', existingAccounts);
          
          // Add depositor IDs from existing accounts
          if (existingAccounts && existingAccounts.length > 0) {
            existingAccounts.forEach(account => {
              if (account.depositor_id && !depositorMap[account.depositor_id]) {
                // Check if the depositor_id looks like an email
                const isEmail = account.depositor_id.includes('@');
                const displayName = isEmail ? account.depositor_id : `Depositor for ${account.account_name}`;
                
                depositorMap[account.depositor_id] = {
                  id: account.depositor_id,
                  name: displayName
                };
              }
            });
          }
        }
        
        // Always include the current user as a depositor option
        depositorMap[userId] = {
          id: userId,
          name: `You (${userEmail})`
        };
        
        // Add the specific email you mentioned
        if (!depositorMap['mohammedkhurram14.mk@gmail.com']) {
          depositorMap['mohammedkhurram14.mk@gmail.com'] = {
            id: 'mohammedkhurram14.mk@gmail.com',
            name: 'Mohammed Khurram (mohammedkhurram14.mk@gmail.com)'
          };
        }
        
        // Convert the map to an array of depositor objects
        const allDepositors = Object.values(depositorMap);
        
        setDepositors(allDepositors);
        console.log('Using depositors:', allDepositors);
      } catch (error) {
        console.error('Error loading depositors:', error);
        // Fall back to minimal data with just the current user and specific email
        const { data: currentUser } = await supabase.auth.getUser();
        const userId = currentUser?.user?.id;
        const userEmail = currentUser?.user?.email;
        
        const minimalDepositors = [
          { id: userId, name: `You (${userEmail})` },
          { id: 'mohammedkhurram14.mk@gmail.com', name: 'Mohammed Khurram (mohammedkhurram14.mk@gmail.com)' }
        ];
        setDepositors(minimalDepositors);
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
        
        {/* User Information Section */}
        <div className={styles.userInfoSection} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>Current User Information</h3>
          <p><strong>Email:</strong> {userInfo.email || 'Not available'}</p>
          <p><strong>User ID:</strong> {userInfo.id || 'Not available'}</p>
          <p><strong>Role:</strong> {userInfo.role || 'Not available'}</p>
          <p><strong>Note:</strong> When creating an account, assign it to a depositor to see it in the depositor view.</p>
        </div>
        
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
                <label htmlFor="bank_name">Bank Name</label>
                <input
                  type="text"
                  id="bank_name"
                  name="bank_name"
                  value={formData.bank_name}
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
                <label htmlFor="account_number">Account Number</label>
                <input
                  type="text"
                  id="account_number"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  required
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="account_name">Account Holder Name</label>
                <input
                  type="text"
                  id="account_name"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleChange}
                  placeholder="Enter account holder name"
                  required
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="upi_id">UPI ID (Optional)</label>
                <input
                  type="text"
                  id="upi_id"
                  name="upi_id"
                  value={formData.upi_id}
                  onChange={handleChange}
                  placeholder="Enter UPI ID (optional)"
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="depositor_id">Assign to Depositor</label>
                <select
                  id="depositor_id"
                  name="depositor_id"
                  value={formData.depositor_id}
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
                        <td>{account.account_name}</td>
                        <td>{account.bank_name}</td>
                        <td>{account.account_number}</td>
                        <td>{account.ifsc}</td>
                        <td className={styles.amountCell}>{parseFloat(account.amount).toLocaleString('en-IN')}</td>
                        <td>{account.upi_id || '-'}</td>
                        <td>
                          {depositors.find(d => d.id === account.depositor_id)?.name || '-'}
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
