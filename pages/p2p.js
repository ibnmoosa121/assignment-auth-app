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
    status: 'pending'    // Default status is pending
  });
  // User info is managed through the user state instead
  // const [userInfo, setUserInfo] = useState({
  //   id: '',
  //   email: '',
  //   role: ''
  // });
  const [accounts, setAccounts] = useState([]);
  const router = useRouter();

  // Function to reset form fields
  const resetForm = () => {
    setFormData({
      amount: '',
      ifsc: '',
      account_number: '',
      account_name: '',
      bank_name: '',
      upi_id: '',
      status: 'pending' // Keep status field for UI consistency, will be mapped to verified=0
    });
  };

  // Function to check if the accounts table exists and has the correct structure
  const checkDatabaseStructure = async () => {
    try {
      // First, test basic Supabase connection
      console.log('Testing Supabase connection...');
      
      // Try to get the current user to test authentication
      const { /* data: authData, */ error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        return false;
      } else {
        console.log('Auth check successful');
      }
      
      try {
        // Try to access the accounts table
        const result = await supabase
          .from('accounts')
          .select('id')
          .limit(1);
        
        const { error } = result;
        if (error) {
          console.error('Error accessing accounts table:', error);
          return false;
        }
        
        console.log('Successfully accessed accounts table');
        return true;
      } catch (tableError) {
        console.error('Error with accounts table:', tableError);
        return false;
      }
    } catch (error) {
      console.error('Error checking database structure:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchUserInfo(user.id);
        
        // Check database structure before fetching accounts
        const dbStructureOk = await checkDatabaseStructure();
        if (dbStructureOk) {
          fetchAccounts(user.id);
        } else {
          console.error('Database structure check failed. The accounts table may not exist or has incorrect structure.');
          alert('There was an issue connecting to the database. Please check the console for details.');
        }
      } else {
        router.push('/auth');
      }
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth');
      }
    });

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const fetchUserInfo = async () => {
    try {
      // Get user info directly from auth.users via getUser() since the users table doesn't exist
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;
      if (user) {
        setUserInfo({
          id: user.id,
          email: user.email,
          role: user.app_metadata?.role || 'user' // Default to 'user' if role is not defined
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchAccounts = async (userId) => {
    try {
      console.log('Fetching accounts for user ID:', userId);
      
      // Use 'created_by' column based on the schema check
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('created_by', userId) // Changed to created_by based on actual schema
        .order('date', { ascending: false }); // Changed from created_at to date based on actual schema

      if (error) {
        console.error('Supabase error when fetching accounts:', error);
        console.log('Trying to get all accounts to check schema...');
        const { data: allData, error: allError } = await supabase
          .from('accounts')
          .select('*')
          .limit(1);
          
        if (allError) {
          console.error('Error getting accounts schema:', allError);
          throw allError;
        } else if (allData && allData.length > 0) {
          console.log('Account schema sample:', Object.keys(allData[0]));
        }
        
        throw error;
      }
      
      console.log('Accounts retrieved:', data);
      
      if (data) {
        setAccounts(data);
      } else {
        console.log('No accounts data returned from Supabase');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Daily totals functionality removed

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData);
      console.log('User ID:', user?.id);
      
      // Create account data object with fields that match the database schema
      const accountData = {
        created_by: user.id, // Changed to created_by based on actual schema
        amount: formData.amount,
        ifsc: formData.ifsc,
        account_number: formData.account_number,
        account_name: formData.account_name,
        bank_name: formData.bank_name,
        upi_id: formData.upi_id,
        // Store status in the 'verified' field since there's no 'status' column
        // Use 0 for pending, 1 for completed
        verified: formData.status === 'completed' ? 1 : 0,
        // Add date field to satisfy the not-null constraint
        date: new Date().toISOString(),
        // Add depositor_id field to satisfy the not-null constraint
        depositor_id: user.id  // Using the current user's ID as the depositor_id
      };
      
      console.log('Account data being inserted:', accountData);
      
      console.log('Account data to insert:', accountData);
      
      const { data, error } = await supabase
        .from('accounts')
        .insert([accountData]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Account added successfully:', data);
      
      // Reset form and fetch updated accounts
      resetForm();
      fetchAccounts(user.id);
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Failed to add account. Please check console for details.');
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('id', accountId);

        if (error) throw error;
        
        // Refresh accounts list after deletion
        fetchAccounts(user.id);
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const handleUpdateStatus = async (accountId, newStatus) => {
    try {
      console.log(`Updating account ${accountId} to status: ${newStatus}`);
      
      // Convert status string to verified value (0 for pending, 1 for completed)
      const verifiedValue = newStatus === 'completed' ? 1 : 0;
      
      // Update the local state immediately for better UX
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === accountId ? { ...account, verified: verifiedValue } : account
        )
      );
      
      // Update the account status in Supabase
      const { error } = await supabase
        .from('accounts')
        .update({ verified: verifiedValue })
        .eq('id', accountId);

      if (error) {
        console.error('Supabase error when updating status:', error);
        alert('Failed to update status. Please try again.');
        // Revert the local state if there's an error
        fetchAccounts(user.id);
        throw error;
      }
      
      console.log(`Successfully updated account ${accountId} status to ${newStatus}`);
    } catch (error) {
      console.error('Error updating account status:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>P2P Transactions</title>
        <meta name="description" content="P2P transaction page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>P2P Platform</div>
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

      <main className={styles.main} style={{ width: '100%', padding: '0 20px' }}>
        <h1 className={styles.title} style={{ marginBottom: '1rem', textAlign: 'center' }}>P2P Transaction</h1>
        
        {/* Form and Account Details Container */}
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          {/* Add New Account Form */}
          <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Add New Account</h2>
          <form onSubmit={handleSubmit} className={styles.p2pForm} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
              {/* First row - Amount and Bank Name */}
              <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                <div className={styles.formGroup} style={{ flex: '1', backgroundColor: 'rgba(38, 193, 126, 0.05)', padding: '10px', borderRadius: '8px' }}>
                  <label htmlFor="amount" style={{ fontWeight: 'bold', color: '#26C17E', marginBottom: '5px', display: 'block' }}>Amount (INR)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    required
                    className={styles.formInput}
                    style={{ borderColor: '#26C17E', width: '100%', padding: '8px' }}
                  />
                </div>
                
                <div className={styles.formGroup} style={{ flex: '1' }}>
                  <label htmlFor="bank_name" style={{ marginBottom: '5px', display: 'block' }}>Bank Name</label>
                  <input
                    type="text"
                    id="bank_name"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="Enter bank name"
                    required
                    className={styles.formInput}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>
              
              {/* Second row - IFSC and Account Number */}
              <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                <div className={styles.formGroup} style={{ flex: '1' }}>
                  <label htmlFor="ifsc" style={{ marginBottom: '5px', display: 'block' }}>IFSC Code</label>
                  <input
                    type="text"
                    id="ifsc"
                    name="ifsc"
                    value={formData.ifsc}
                    onChange={handleChange}
                    placeholder="Enter IFSC code"
                    required
                    className={styles.formInput}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                
                <div className={styles.formGroup} style={{ flex: '1' }}>
                  <label htmlFor="account_number" style={{ marginBottom: '5px', display: 'block' }}>Account Number</label>
                  <input
                    type="text"
                    id="account_number"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    required
                    className={styles.formInput}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>
              
              {/* Third row - Account Holder Name and UPI ID */}
              <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                <div className={styles.formGroup} style={{ flex: '1' }}>
                  <label htmlFor="account_name" style={{ marginBottom: '5px', display: 'block' }}>Account Holder Name</label>
                  <input
                    type="text"
                    id="account_name"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleChange}
                    placeholder="Enter account holder name"
                    required
                    className={styles.formInput}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                
                <div className={styles.formGroup} style={{ flex: '1' }}>
                  <label htmlFor="upi_id" style={{ marginBottom: '5px', display: 'block' }}>UPI ID (Optional)</label>
                  <input
                    type="text"
                    id="upi_id"
                    name="upi_id"
                    value={formData.upi_id}
                    onChange={handleChange}
                    placeholder="Enter UPI ID (optional)"
                    className={styles.formInput}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '15px' }}>
              <button type="submit" className={styles.submitButton} style={{ width: '100%', padding: '10px', fontSize: '1rem', fontWeight: 'bold', backgroundColor: '#26C17E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Add Account
              </button>
            </div>
          </form>

          {/* Account Details Section */}
          <div style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '1.5rem', backgroundColor: '#26C17E', color: 'white', padding: '10px', borderRadius: '8px' }}>Account Details</h2>
            
            {/* Daily Totals section removed */}
            
            {/* Accounts Table */}
            <div style={{ width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 8px', textAlign: 'left', backgroundColor: '#26C17E', color: 'white', borderRadius: '4px 0 0 0', width: '12%' }}>Amount</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', backgroundColor: '#26C17E', color: 'white', width: '12%' }}>Bank</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', backgroundColor: '#26C17E', color: 'white', width: '15%' }}>Account Number</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', backgroundColor: '#26C17E', color: 'white', width: '15%' }}>Account Holder</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', backgroundColor: '#26C17E', color: 'white', width: '15%' }}>Date</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#26C17E', color: 'white', width: '15%' }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#26C17E', color: 'white', borderRadius: '0 4px 0 0', width: '11%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length > 0 ? (
                    accounts.map(account => (
                      <tr key={account.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '15px 10px', color: '#26C17E', fontWeight: 'bold' }}>₹{parseFloat(account.amount).toFixed(2)}</td>
                        <td style={{ padding: '15px 10px' }}>{account.bank_name}</td>
                        <td style={{ padding: '15px 10px' }}>{account.account_number}</td>
                        <td style={{ padding: '15px 10px' }}>{account.account_name}</td>
                        <td style={{ padding: '15px 10px' }}>{new Date(account.date).toLocaleDateString()}</td>
                        <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                          <select 
                            value={account.verified === 1 ? 'completed' : 'pending'}
                            onChange={(e) => handleUpdateStatus(account.id, e.target.value)}
                            style={{
                              padding: '10px',
                              borderRadius: '4px',
                              border: 'none',
                              width: '100%',
                              backgroundColor: account.verified === 1 ? '#1890ff' : '#fa8c16',
                              color: 'white',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              WebkitAppearance: 'none',
                              MozAppearance: 'none',
                              appearance: 'none',
                              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 10px center',
                              backgroundSize: '12px'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDeleteAccount(account.id)} 
                            style={{ 
                              backgroundColor: '#ff4d4f', 
                              color: 'white', 
                              border: 'none', 
                              padding: '8px 12px', 
                              borderRadius: '4px', 
                              cursor: 'pointer',
                              width: '100%',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ padding: '20px', textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>No accounts found. Add your first account above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} P2P Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
