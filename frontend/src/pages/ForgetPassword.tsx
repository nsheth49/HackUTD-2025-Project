import { useState } from 'react';
import { IconArrowLeft, IconMail, IconLock, IconEye, IconEyeOff } from '../components/Icons';
import './ForgetPassword.css';
import { sendPasswordResetWithCode } from '../utils/firebaseAuth';
import { verifyCode } from '../utils/firestore';
import { resetPasswordAfterVerification } from '../utils/firebaseAuth';
import { validatePassword, validatePasswordMatch } from '../utils/validation';

type Step = 'email' | 'code' | 'password';

const ForgotPassword = ({ setPage }: { setPage: (page: string) => void }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get('email-forgot') as string;

    try {
      const { success, code, error } = await sendPasswordResetWithCode(emailValue);
      
      if (!success || error) {
        setError(error || 'Failed to send verification code');
        setIsLoading(false);
        return;
      }

      setEmail(emailValue);
      setCodeSent(true);
      
      // For development: show code in alert
      // In production, this would be sent via email through Cloud Functions
      if (code) {
        alert(`Verification code sent! (Development mode)\nYour verification code is: ${code}\n\nIn production, this code would be sent to your email.`);
      }
      
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const code = formData.get('verification-code') as string;

    try {
      const { success, error } = await verifyCode(email, code);
      
      if (!success || error) {
        setError(error || 'Invalid verification code');
        setIsLoading(false);
        return;
      }

      setStep('password');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Password validation failed');
      setIsLoading(false);
      return;
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(newPassword, confirmPassword);
    if (!passwordMatchValidation.isValid) {
      setError(passwordMatchValidation.error || 'Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { success, error } = await resetPasswordAfterVerification(email, newPassword);
      
      if (!success || error) {
        setError(error || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      // Check if password was updated (Cloud Function should process it)
      // For now, we'll show success and redirect
      // In production with Cloud Function, the password will be updated automatically
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setPage('login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-container">
        <div className="forgot-content">
          <div className="forgot-success">
            <h2 className="forgot-title">Password Reset Request Submitted!</h2>
            <p className="forgot-subtitle">
              Your password reset request has been submitted. A Cloud Function will process your request and update your password. Redirecting to login...
            </p>
            {import.meta.env.DEV && (
              <p className="forgot-subtitle" style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                Note: Deploy the Cloud Function in functions/index.js to enable automatic password updates. A backup password reset email has also been sent.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-container">
      <div className="forgot-content">
        <button
          onClick={() => {
            if (step === 'email') {
              setPage('login');
            } else {
              setStep(step === 'code' ? 'email' : 'code');
              setError(null);
            }
          }}
          className="forgot-back-button"
        >
          <IconArrowLeft />
          {step === 'email' ? 'Back to Sign In' : 'Back'}
        </button>
        
        <div className="forgot-title-section">
          <h2 className="forgot-title">Forgot Password?</h2>
          <p className="forgot-subtitle">
            {step === 'email' && "Enter your email address and we'll send you a verification code to reset your password."}
            {step === 'code' && "Enter the verification code sent to your email address."}
            {step === 'password' && "Enter your new password."}
          </p>
        </div>

        {step === 'email' && (
          <form className="forgot-form" onSubmit={handleSendCode}>
            <div className="forgot-input-group">
              <label htmlFor="email-forgot" className="forgot-label">Email Address</label>
              <div className="forgot-input-wrapper">
                <div className="forgot-input-icon">
                  <IconMail />
                </div>
                <input
                  id="email-forgot"
                  name="email-forgot"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="forgot-input"
                />
              </div>
            </div>

            {error && (
              <div className="forgot-error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="forgot-button"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form className="forgot-form" onSubmit={handleVerifyCode}>
            <div className="forgot-input-group">
              <label htmlFor="verification-code" className="forgot-label">Verification Code</label>
              <div className="forgot-input-wrapper">
                <input
                  id="verification-code"
                  name="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="forgot-input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              {codeSent && (
                <p className="forgot-code-hint">
                Code sent to {email}. Check your email or the alert for the verification code.
              </p>
              )}
            </div>

            {error && (
              <div className="forgot-error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="forgot-button"
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form className="forgot-form" onSubmit={handleResetPassword}>
            <div className="forgot-input-group">
              <label htmlFor="new-password" className="forgot-label">New Password</label>
              <div className="forgot-input-wrapper">
                <div className="forgot-input-icon">
                  <IconLock />
                </div>
                <input
                  id="new-password"
                  name="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  required
                  className="forgot-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div className="forgot-input-suffix">
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>
            </div>

            <div className="forgot-input-group">
              <label htmlFor="confirm-password" className="forgot-label">Confirm New Password</label>
              <div className="forgot-input-wrapper">
                <div className="forgot-input-icon">
                  <IconLock />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  required
                  className="forgot-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="forgot-input-suffix">
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="forgot-error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="forgot-button"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
