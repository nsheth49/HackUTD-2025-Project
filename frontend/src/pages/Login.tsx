import { useState } from 'react';
import { IconMail, IconLock, IconEye, IconEyeOff, IconGoogle, IconMicrosoft } from '../components/Icons';
import './Login.css';
import { signInWithEmail } from '../utils/firebaseAuth';

const Login = ({ setPage }: { setPage: (page: string) => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Authenticate user with Firebase
      const { user, error: authError } = await signInWithEmail(email, password);
      
      if (authError || !user) {
        setError(authError || 'Failed to sign in');
        setIsLoading(false);
        return;
      }

      // Success - navigate to home page
      setPage('home');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    console.log('Google OAuth login');
  };

  const handleMicrosoftAuth = () => {
    console.log('Microsoft OAuth login');
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <div className="login-icon-container">
            <IconLock />
          </div>
          <h1 className="login-brand">Toyota NextAI</h1>
        </div>
        
        <div className="login-title-section">
          <h2 className="login-title">Sign In</h2>
          <p className="login-subtitle">Enter your credentials to access your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label htmlFor="email" className="login-label">Email Address</label>
            <div className="login-input-wrapper">
              <div className="login-input-icon">
                <IconMail />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="login-input"
              />
            </div>
          </div>

          <div className="login-input-group">
            <label htmlFor="password" className="login-label">Password</label>
            <div className="login-input-wrapper">
              <div className="login-input-icon">
                <IconLock />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                className="login-input"
              />
              <div className="login-input-suffix">
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
          </div>

          <div className="login-options">
            <div className="login-checkbox-wrapper">
              <input 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
                className="login-checkbox"
              />
              <label htmlFor="remember-me" className="login-checkbox-label">
                Remember me
              </label>
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setPage('forgot'); }}
              className="login-forgot-link"
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <div className="login-error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-divider">
          <div className="login-divider-line"></div>
          <div className="login-divider-text">
            <span>Or continue with</span>
          </div>
        </div>

        <div className="login-social-buttons">
          <button className="login-social-button" onClick={handleGoogleAuth}>
            <span className="login-social-button-icon">
              <IconGoogle />
            </span>
            <span className="login-social-button-text">Google</span>
          </button>
          <button className="login-social-button" onClick={handleMicrosoftAuth}>
            <span className="login-social-button-icon">
              <IconMicrosoft />
            </span>
            <span className="login-social-button-text">Microsoft</span>
          </button>
        </div>

        <div className="login-footer">
          <p className="login-footer-text">
            Don't have an account?{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setPage('signup'); }}
              className="login-footer-link"
            >
              Sign up
            </a>
          </p>
          <div className="login-footer-links">
            <a href="#">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
