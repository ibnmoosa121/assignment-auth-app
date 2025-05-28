import Head from 'next/head';
import { useState } from 'react';
import styles from '../styles/Auth.module.css';

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
    };

    const handleSignInSubmit = (e) => {
        e.preventDefault();
        // Handle sign-in logic
        console.log('Sign In submitted');
        alert('Sign In functionality not implemented yet.');
    };

    const handleSignUpSubmit = (e) => {
        e.preventDefault();
        // Handle sign-up logic
        console.log('Sign Up submitted');
        alert('Sign Up functionality not implemented yet.');
    };

    return (
        <>
            <Head>
                <title>Authentication - NextJS</title>
                <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet" />
            </Head>
            <div className={styles.body}>
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
        </>
    );
}