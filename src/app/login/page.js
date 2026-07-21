"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) setError(message);
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'login',
        email: formData.email,
        password: formData.password,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      setError(data.error === 'Invalid login credentials'
        ? 'The email or password is incorrect. Please try again.'
        : data.error || 'Unable to sign in. Please try again.');
      setIsLoading(false);
      return;
    }

    const isAdmin = ['admin', 'super_admin', 'manager', 'support'].includes(data.role);
    const redirect = searchParams.get('redirect');

    if (redirect) {
      router.push(redirect);
    } else if (isAdmin) {
      router.push('/admin');
    } else {
      router.push('/account');
    }
    router.refresh();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'signup',
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      setError(data.error === 'User already registered'
        ? 'This email is already registered. Please sign in.'
        : data.error || 'Unable to create this account. Please try again.');
      setIsLoading(false);
      return;
    }

    if (data.verificationRequired) {
      setSuccess(data.message || 'Account created successfully. Please check your email and verify your account.');
    } else {
      setSuccess('Account created successfully. You can now use your account.');
      router.push('/account');
      router.refresh();
    }
    setIsLoading(false);
    setFormData({ fullName: '', email: '', password: '' });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/account/settings?mode=reset`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSuccess('A password reset link has been sent to your email.');
    setIsLoading(false);
    setIsForgotPassword(false);
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.imageSection}>
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
            <h1>
              {isForgotPassword
                ? 'Reset Password'
                : isLogin
                ? 'Welcome Back'
                : 'Create Account'}
            </h1>
            <p>
              {isForgotPassword
                ? 'Enter your email to receive a password reset link.'
                : isLogin
                ? 'Sign in to access your personalized experience.'
                : 'Join us to experience premium lifestyle and fashion.'}
            </p>
          </div>

          {error && (
            <div className={styles.alertError}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.alertSuccess}>
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          {isForgotPassword ? (
            <form className={styles.form} onSubmit={handleForgotPassword}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? <Loader size={18} className={styles.spinner} /> : 'Send Reset Link'}
              </button>

              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }}
              >
                ← Back to Sign In
              </button>
            </form>
          ) : (
            <form
              className={styles.form}
              onSubmit={isLogin ? handleLogin : handleRegister}
            >
              {!isLogin && (
                <div className={styles.inputGroup}>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className={styles.inputGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeBtn}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className={styles.forgotPassword}>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                    className={styles.forgotBtn}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? (
                  <Loader size={18} className={styles.spinner} />
                ) : isLogin ? (
                  'SIGN IN'
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </form>
          )}

          {!isForgotPassword && (
            <div className={styles.toggleMode}>
              <p>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  className={styles.toggleBtn}
                >
                  {isLogin ? 'Register now' : 'Sign in'}
                </button>
              </p>
              {isLogin && (
                <p className={styles.guestOrderLink}>
                  Ordered without an account? <Link href="/orders/track">Track your order</Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
