import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Auth.module.css';
import { supabase } from './supabaseClient';

export default function AuthPage() {
    console.log("<<<<<< BUILDING LATEST AUTH PAGE - VERCEL TEST >>>>>>");
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

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
            .catch(error => { // Catches if signInWithPassword itself rejects (e.g. network issue)
                // console.error('Unexpected error during sign in:', error); // Already commented
                alert('An unexpected error occurred. Please try again.');
            });
    };

    const handleSignUpSubmit = (e) => {
        e.preventDefault();
        setMessage('');

        const email = e.target.signUpEmail.value;
        const password = e.target.signUpPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        supabase.auth.signUp({ email, password })
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
            .catch(error => {
                // This catch is for unexpected errors during the signUp call itself (e.g. network)
                // console.error('Unexpected error during sign up:', error);
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
                        <div className={styles.formContainer}>
                            <form id="signInForm" className={styles.form} onSubmit={handleSignInSubmit}>
                                <h2>Sign In</h2>
                                {message && <p className={styles.successMessage}>{message}</p>}
                                <div className={styles.inputGroup}>
                                    <input type="email" id="signInEmail" placeholder="Email or Username" required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <input type="password" id="signInPassword" placeholder="Password" required />
                                </div>
                                <button type="submit" className={styles.btn}>Sign In</button>
                            </form>
                            <form id="signUpForm" className={styles.form} onSubmit={handleSignUpSubmit}>
                                <h2>Sign Up</h2>
                                {message && <p className={styles.successMessage}>{message}</p>}
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
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}