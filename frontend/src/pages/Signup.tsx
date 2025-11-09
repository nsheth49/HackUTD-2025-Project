import React, { useState } from 'react';
import { IconMail, IconLock, IconEye, IconEyeOff, IconGoogle, IconMicrosoft, IconUser, IconCalendar, IconCheckCircle } from '../components/Icons';
import './Signup.css';
import { signUpWithEmail, checkEmailExists } from '../utils/firebaseAuth';
import { saveUserProfile } from '../utils/firestore';
import { validatePassword, validatePasswordMatch, validateAge, validateEmail } from '../utils/validation';

const Signup = ({ setPage }: { setPage: (page: string) => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
  });

  const handlePasswordChange = (password: string) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('full-name') as string;
    const email = formData.get('email-signup') as string;
    const dob = formData.get('dob') as string;
    const password = formData.get('password-signup') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    try {
      // Validate email format
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        setError(emailValidation.error || 'Invalid email');
        setIsLoading(false);
        return;
      }

      // Check if email is already in use
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setError('This email address is already in use');
        setIsLoading(false);
        return;
      }

      // Validate age (must be at least 13)
      const ageValidation = validateAge(dob);
      if (!ageValidation.isValid) {
        setError(ageValidation.error || 'Age validation failed');
        setIsLoading(false);
        return;
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.error || 'Password validation failed');
        setIsLoading(false);
        return;
      }

      // Validate password match
      const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
      if (!passwordMatchValidation.isValid) {
        setError(passwordMatchValidation.error || 'Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Create user account with Firebase Auth
      // NOTE: Password is automatically hashed by Firebase Authentication
      // The password is securely stored in Firebase Auth (hashed, not plain text)
      // We NEVER save passwords to Firestore - only profile data
      const { user, error: authError } = await signUpWithEmail(email, password, fullName);
      
      if (authError || !user) {
        setError(authError || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // Save user profile to Firestore (password is NOT included - it's in Firebase Auth)
      const { error: profileError } = await saveUserProfile(user, {
        fullName,
        email,
        dateOfBirth: dob,
        // Password is intentionally NOT saved here - it's securely stored in Firebase Auth
      });

      if (profileError) {
        setError(profileError);
        setIsLoading(false);
        return;
      }

      // Success - navigate to financial page
      setPage('financial');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    console.log('Google OAuth signup');
  };

  const handleMicrosoftAuth = () => {
    console.log('Microsoft OAuth signup');
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <div className="signup-header">
          <div className="signup-icon-container">
            <IconLock />
          </div>
          <h1 className="signup-brand">Toyota NextAI</h1>
        </div>
        
        <div className="signup-title-section">
          <h2 className="signup-title">Create Account</h2>
          <p className="signup-subtitle">Fill in your details to get started</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-input-group">
            <label htmlFor="full-name" className="signup-label">Full Name</label>
            <div className="signup-input-wrapper">
              <div className="signup-input-icon">
                <IconUser />
              </div>
              <input
                id="full-name"
                name="full-name"
                type="text"
                placeholder="John Doe"
                required
                className="signup-input"
              />
            </div>
          </div>

          <div className="signup-input-group">
            <label htmlFor="email-signup" className="signup-label">Email Address</label>
            <div className="signup-input-wrapper">
              <div className="signup-input-icon">
                <IconMail />
              </div>
              <input
                id="email-signup"
                name="email-signup"
                type="email"
                placeholder="you@example.com"
                required
                className="signup-input"
              />
            </div>
          </div>

          <div className="signup-input-group">
            <label htmlFor="dob" className="signup-label">Date of Birth</label>
            <div className="signup-input-wrapper">
              <div className="signup-input-icon">
                <IconCalendar />
              </div>
              <input
                id="dob"
                name="dob"
                type="text"
                placeholder="Pick a date"
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target.type = 'date')}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.type = 'text')}
                required
                className="signup-input"
              />
            </div>
          </div>
          <p className="signup-age-notice">You must be at least 13 years old</p>

          <div className="signup-input-group">
            <label htmlFor="password-signup" className="signup-label">Password</label>
            <div className="signup-input-wrapper">
              <div className="signup-input-icon">
                <IconLock />
              </div>
              <input
                id="password-signup"
                name="password-signup"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                required
                className="signup-input"
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              <div className="signup-input-suffix">
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
          </div>
          
          <ul className="signup-password-requirements">
            <li className={`signup-password-requirement ${passwordRequirements.minLength ? 'requirement-met' : ''}`}>
              <IconCheckCircle />
              <span>At least 8 characters</span>
            </li>
            <li className={`signup-password-requirement ${passwordRequirements.hasUpperCase ? 'requirement-met' : ''}`}>
              <IconCheckCircle />
              <span>One uppercase letter</span>
            </li>
            <li className={`signup-password-requirement ${passwordRequirements.hasLowerCase ? 'requirement-met' : ''}`}>
              <IconCheckCircle />
              <span>One lowercase letter</span>
            </li>
            <li className={`signup-password-requirement ${passwordRequirements.hasNumber ? 'requirement-met' : ''}`}>
              <IconCheckCircle />
              <span>One number</span>
            </li>
          </ul>
          
          {error && (
            <div className="signup-error-message">
              {error}
            </div>
          )}

          <div className="signup-input-group">
            <label htmlFor="confirm-password" className="signup-label">Confirm Password</label>
            <div className="signup-input-wrapper">
              <div className="signup-input-icon">
                <IconLock />
              </div>
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                required
                className="signup-input"
              />
              <div className="signup-input-suffix">
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="signup-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="signup-divider">
          <div className="signup-divider-line"></div>
          <div className="signup-divider-text">
            <span>Or continue with</span>
          </div>
        </div>

        <div className="signup-social-buttons">
          <button className="signup-social-button" onClick={handleGoogleAuth}>
            <span className="signup-social-button-icon">
              <IconGoogle />
            </span>
            <span className="signup-social-button-text">Google</span>
          </button>
          <button className="signup-social-button" onClick={handleMicrosoftAuth}>
            <span className="signup-social-button-icon">
              <IconMicrosoft />
            </span>
            <span className="signup-social-button-text">Microsoft</span>
          </button>
        </div>

        <div className="signup-footer">
          <p className="signup-footer-text">
            Already have an account?{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setPage('login'); }}
              className="signup-footer-link"
            >
              Sign in
            </a>
          </p>
          <div className="signup-footer-links">
            <a href="#">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
