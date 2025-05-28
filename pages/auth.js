import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Auth.module.css';
import { supabase } from './supabaseClient';

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
    };

    const handleSignInSubmit = (e) => {
        e.preventDefault();
        console.log('Sign In submitted');
        alert('Sign In functionality not implemented yet.');
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
                <title>Authentication - NextJS</title>
                <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;700&family=Orbitron:wght@400;700&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet" />
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
                            {!isSignUp ? (
                                <form id="signInForm" className={`${styles.form} ${styles.activeForm}`} onSubmit={handleSignInSubmit}>
                                    <h2>Sign In</h2>
                                    <div className={styles.inputGroup}>
                                        <input type="email" id="signInEmail" placeholder="Email or Username" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <input type="password" id="signInPassword" placeholder="Password" required />
                                    </div>
                                    <button type="submit" className={styles.btn}>Sign In</button>
                                    <p className={styles.toggleText}>
                                        Don&apos;t have an account? <span className={styles.toggleLink} onClick={toggleForm}>Sign Up</span>
                                    </p>
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
                                    <p className={styles.toggleText}>
                                        Already have an account? <span className={styles.toggleLink} onClick={toggleForm}>Sign In</span>
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}