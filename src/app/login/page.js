"use client";
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './page.module.css';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const toggleAuthMode = () => setIsLogin(!isLogin);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    // This will be connected to Supabase Auth in the future
    alert("Authentication functionality will be connected to our Supabase Database soon!");
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.imageSection}>
        {/* Placeholder image for luxury brand feel */}
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
          alt="Brand Aesthetics" 
          className={styles.bgImage} 
        />
        <div className={styles.imageOverlay}>
          <h2>CartsVista</h2>
          <p>Experience sublime artistic explorations in retail.</p>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h1>{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
            <p>{isLogin ? 'Sign in to access your personalized experience.' : 'Join us to experience premium lifestyle and fashion.'}</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {!isLogin && (
              <div className={styles.inputGroup}>
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" placeholder="John Doe" required />
              </div>
            )}
            
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" placeholder="john@example.com" required />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  placeholder="••••••••" 
                  required 
                />
                <button type="button" onClick={togglePasswordVisibility} className={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className={styles.forgotPassword}>
                <a href="#">Forgot your password?</a>
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>
              {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className={styles.toggleMode}>
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={toggleAuthMode} className={styles.toggleBtn}>
                {isLogin ? 'Register now' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
