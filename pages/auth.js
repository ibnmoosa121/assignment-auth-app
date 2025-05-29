import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Auth.module.css';
import { supabase } from './supabaseClient';

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [invalidCredentials, setInvalidCredentials] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
        setMessage(''); // Clear messages when toggling forms
        setError('');
        setInvalidCredentials(false); // Reset invalid credentials state
    };

    const handleSignInSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const email = e.target.signInEmail.value;
        const password = e.target.signInPassword.value;

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (signInError) {
                console.error('Sign in error:', signInError);
                setError(`Sign in failed: ${signInError.message}`);
                setInvalidCredentials(true); // Set invalid credentials to trigger button animation
            } else {
                console.log('Sign in successful:', data);
                setMessage('Sign in successful! Redirecting to home page...');
                // Redirect to landing page after a brief delay to show the success message
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            }
        } catch (error) {
            console.error('Unexpected error during sign in:', error);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const email = e.target.signUpEmail.value;
        const password = e.target.signUpPassword.value;
        const confirmPassword = e.target.confirmPassword.value;
        // const username = e.target.signUpUsername.value; // Optional: for later use

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            // options: { // Optional: include additional data like username
            //   data: {
            //     username: username,
            //   }
            // }
        });

        if (signUpError) {
            console.error('Sign up error:', signUpError);
            setError(`Sign up failed: ${signUpError.message}`);
        } else {
            console.log('Sign up successful:', data);
            setMessage('Sign up successful! Please check your email to confirm.');
            // Optionally, you can reset the form or redirect the user
            e.target.reset(); // Reset form fields
        }
    };

    return (
        <>
            <Head>
                <title>Authentication - NovaP2P</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
                            <div className={`${styles.toggleButton} ${isSignUp ? styles.toggleRight : styles.toggleLeft}`}>
                                <div 
                                    className={`${styles.toggleOption} ${!isSignUp ? styles.activeOption : ''}`}
                                    onClick={() => setIsSignUp(false)}
                                >
                                    Sign In
                                </div>
                                <div 
                                    className={`${styles.toggleOption} ${isSignUp ? styles.activeOption : ''}`}
                                    onClick={() => setIsSignUp(true)}
                                >
                                    Sign Up
                                </div>
                                <div className={styles.slider}></div>
                            </div>
                        </div>
                        <div className={styles.formContainer}>
                            {!isSignUp ? (
                                <form id="signInForm" className={`${styles.form} ${styles.activeForm}`} onSubmit={handleSignInSubmit}>
                                    <h2>Sign In</h2>
                                    {message && <p className={styles.successMessage}>{message}</p>}
                                    {error && <p className={styles.errorMessage}>{error}</p>}
                                    <div className={styles.inputGroup}>
                                        <input type="email" id="signInEmail" placeholder="Email or Username" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="password" id="signInPassword" placeholder="Password" required />
                                    </div>
                                    <button type="submit" className={`${styles.btn} ${invalidCredentials ? styles.invalidBtn : ''}`}>Sign In</button>
                                </form>
                            ) : (
                                <form id="signUpForm" className={`${styles.form} ${styles.activeForm}`} onSubmit={handleSignUpSubmit}>
                                    <h2>Sign Up</h2>
                                    {message && <p className={styles.successMessage}>{message}</p>}
                                    {error && <p className={styles.errorMessage}>{error}</p>}
                                    <div className={styles.inputGroup}>
                                        <input type="text" id="signUpUsername" placeholder="Username" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="email" id="signUpEmail" placeholder="Email" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="password" id="signUpPassword" placeholder="Password" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="password" id="confirmPassword" placeholder="Confirm Password" required />
                                    </div>
                                    <button type="submit" className={styles.btn}>Sign Up</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}