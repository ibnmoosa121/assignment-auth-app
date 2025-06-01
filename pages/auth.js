import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Auth.module.css';
import { supabase } from '../utils/supabaseClient';

export default function AuthPage() {
    console.log("<<<<<< BUILDING LATEST AUTH PAGE - VERCEL TEST >>>>>>");
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [showSignUp, setShowSignUp] = useState(false); // Added state for toggling forms

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        // Check for email confirmation
        const checkEmailConfirmation = async () => {
            try {
                // Get the URL hash parameters
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                
                // Check if this is a confirmation callback
                const isConfirmation = (
                    // Check for the standard confirmation format
                    (params.get('type') === 'signup' && params.get('access_token')) ||
                    // Check for the alternative format
                    (hash.includes('access_token') && hash.includes('type=signup'))
                );
                
                if (isConfirmation) {
                    // Let Supabase handle the auth session first
                    await supabase.auth.getSession();
                    
                    // Switch to sign in form and show message
                    setShowSignUp(false);
                    setMessage('Email verified! Please sign in with your credentials.');
                    
                    // Clear the hash to avoid showing the message again on refresh
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }
            } catch (error) {
                console.error('Error checking email confirmation:', error);
            }
        };
        
        checkEmailConfirmation();
        
        return () => clearTimeout(timer);
    }, []);

    const handleSignInSubmit = (e) => {
        e.preventDefault();
        setMessage('');

        const email = e.target.signInEmail.value;
        const password = e.target.signInPassword.value;

        supabase.auth.signInWithPassword({ email, password })
            .then(({ data, error: signInError }) => {
                if (signInError) {
                    // console.error('Sign in error:', signInError.message); // Already commented
                    alert(`Sign in failed: ${signInError.message}`);
                    // setInvalidCredentials(true); // Already commented
                    // No explicit return needed here as it's the end of this promise chain path
                } else {
                    console.log('Sign in successful:', data);
                    setMessage('Sign in successful! Redirecting to home page...');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                }
            })
            .catch(() => { // Catches if signInWithPassword itself rejects (e.g. network issue)
                // console.error('Unexpected error during sign in'); // Already commented
                alert('An unexpected error occurred. Please try again');
            });
    };

    const handleSignUpSubmit = (e) => {
        e.preventDefault();
        setMessage('');

        const username = e.target.signUpUsername.value;
        const email = e.target.signUpEmail.value;
        const password = e.target.signUpPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    username: username
                }
            }
        })
            .then(({ data, error: signUpError }) => {
                if (signUpError) {
                    // console.error('Sign up error:', signUpError); // Already commented
                    alert(`Sign up failed: ${signUpError.message}`);
                    // No explicit return needed here as it's the end of this promise chain path
                } else {
                    console.log('Sign up successful:', data);
                    setMessage('Sign up successful! Please check your email to confirm.');
                    e.target.reset(); // Reset form fields
                }
            })
            .catch(() => {
                // This catch is for unexpected errors during the signUp call itself (e.g. network)
                // console.error('Unexpected error during sign up');
                alert('An unexpected error occurred during sign up. Please try again.');
            });
    };

    return (
        <>
            <Head>
                <title>Authentication - NovaP2P</title>
            </Head>
            {isLoading ? (
                <div className={`${styles.splashScreen} ${isLoading ? '' : styles.splashScreenHidden}`}>
                    <div className={styles.splashLoader}></div>
                </div>
            ) : (
                <div className={styles.body}>
                    {/* Branding Logo */}
                    <div className={styles.brandingLogo}>NovaP2P</div>

                    <div className={styles.container}>
                        <div className={styles.toggleContainer}>
                            <div 
                                className={`${styles.toggleOption} ${!showSignUp ? styles.active : ''}`}
                                onClick={() => { setShowSignUp(false); setMessage(''); }}
                            >
                                Sign In
                            </div>
                            <div 
                                className={`${styles.toggleOption} ${showSignUp ? styles.active : ''}`}
                                onClick={() => { setShowSignUp(true); setMessage(''); }}
                            >
                                Sign Up
                            </div>
                            <div className={`${styles.toggleSlider} ${showSignUp ? styles.right : ''}`}></div>
                        </div>
                        <div className={styles.formContainer}>
                            {showSignUp ? (
                                <form id="signUpForm" className={styles.form} onSubmit={handleSignUpSubmit}>
                                    <h2>Sign Up</h2>
                                    {message && <p className={styles.successMessage}>{message}</p>}
                                    <div className={styles.inputGroup}>
                                        <input type="text" id="signUpUsername" name="signUpUsername" placeholder="Username" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="email" id="signUpEmail" name="signUpEmail" placeholder="Email" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="password" id="signUpPassword" name="signUpPassword" placeholder="Password" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm Password" required />
                                    </div>
                                    <button type="submit" className={styles.btn}>Sign Up</button>
                                </form>
                            ) : (
                                <form id="signInForm" className={styles.form} onSubmit={handleSignInSubmit}>
                                    <h2>Sign In</h2>
                                    {message && <p className={styles.successMessage}>{message}</p>}
                                    <div className={styles.inputGroup}>
                                        <input type="email" id="signInEmail" name="signInEmail" placeholder="Email or Username" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="password" id="signInPassword" name="signInPassword" placeholder="Password" required />
                                    </div>
                                    <button type="submit" className={styles.btn}>Sign In</button>
                                </form>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}