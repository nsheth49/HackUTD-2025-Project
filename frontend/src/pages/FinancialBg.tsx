import { useState, useEffect } from "react";
import './FinancialBg.css';
import { auth } from '../config/firebase';
import { saveFinancialData } from '../utils/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

// Custom hook for simple form input handling
const useFormInput = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  return {
    value,
    onChange: handleChange,
  };
};

// Re-usable Input component to replace components/ui/Input
const CustomInput = ({ id, label, helperText, ...props }: any) => (
  <div className="financial-input-group">
    <label htmlFor={id} className="financial-label">
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="financial-input"
    />
    {helperText && (
      <p className="financial-helper-text">{helperText}</p>
    )}
  </div>
);

// Re-usable Button component to replace components/ui/Button
const CustomButton = ({ children, ...props }: any) => (
  <button
    {...props}
    className="financial-button"
  >
    {children}
  </button>
);

export default function FinancialBackgroundVisual({ setPage }: { setPage?: (page: string) => void }) {
  const creditScore = useFormInput("");
  const income = useFormInput("");
  const debtToIncomeRatio = useFormInput("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!currentUser) {
      setError('You must be logged in to save financial data');
      setIsLoading(false);
      return;
    }

    try {
      const creditScoreValue = parseFloat(creditScore.value);
      const incomeValue = parseFloat(income.value);
      const debtToIncomeValue = parseFloat(debtToIncomeRatio.value);

      // Validate inputs
      if (isNaN(creditScoreValue) || creditScoreValue < 300 || creditScoreValue > 850) {
        setError('Credit score must be between 300 and 850');
        setIsLoading(false);
        return;
      }

      if (isNaN(incomeValue) || incomeValue < 0) {
        setError('Annual income must be a positive number');
        setIsLoading(false);
        return;
      }

      if (isNaN(debtToIncomeValue) || debtToIncomeValue < 0 || debtToIncomeValue > 100) {
        setError('Debt-to-income ratio must be between 0 and 100');
        setIsLoading(false);
        return;
      }

      // Save financial data to Firestore
      const { error: saveError } = await saveFinancialData(currentUser, {
        creditScore: creditScoreValue,
        annualIncome: incomeValue,
        debtToIncomeRatio: debtToIncomeValue,
      });

      if (saveError) {
        setError(saveError);
        setIsLoading(false);
        return;
      }

      // Success - navigate to home page
      if (setPage) {
        setPage('home');
      } else {
        setShowSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Success Screen ---
  if (showSuccess) {
    return (
      <div className="financial-success-container">
        {/* Left Panel - Branded Section */}
        <div className="financial-left-panel">
          <div className="financial-left-panel-overlay">
            <div className="financial-left-panel-circle-1"></div>
            <div className="financial-left-panel-circle-2"></div>
          </div>
          
          <div className="financial-left-panel-content">
            <h1 className="financial-left-panel-brand">SecurePortal</h1>
            <h2 className="financial-left-panel-title">All Set!</h2>
            <p className="financial-left-panel-text">
              Your financial profile has been successfully saved.
            </p>
          </div>
        </div>

        {/* Right Panel - Success Message */}
        <div className="financial-success-right-panel">
          <div className="financial-success-content">
            <h2 className="financial-success-title">Profile Complete!</h2>
            <p className="financial-success-text">
              Your financial information has been securely saved. You're all set
              to get started!
            </p>

            <div className="financial-success-box">
              <p className="financial-success-box-text">
                Your information is encrypted and stored securely.
              </p>
            </div>

            <CustomButton onClick={() => {
              if (setPage) {
                setPage('home');
              } else {
                setShowSuccess(false);
              }
            }}>
              Continue to Dashboard
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  // --- Form Screen ---
  return (
    <div className="financial-container">
      {/* Left Panel - Branded Section */}
      <div className="financial-left-panel">
        <div className="financial-left-panel-overlay">
          <div className="financial-left-panel-circle-1"></div>
          <div className="financial-left-panel-circle-2"></div>
        </div>

        <div className="financial-left-panel-content">
          <h1 className="financial-left-panel-brand">SecurePortal</h1>
          <h2 className="financial-left-panel-title">Financial Profile</h2>
          <p className="financial-left-panel-text">
            Help us understand your financial background to provide
            personalized services.
          </p>
        </div>
      </div>

      {/* Right Panel - Financial Background Form */}
      <div className="financial-right-panel">
        <div className="financial-form-wrapper">
          <div className="financial-header">
            <h2 className="financial-title">Financial Background</h2>
            <p className="financial-subtitle">
              Tell us about your financial situation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="financial-form">
            <CustomInput
              id="creditScore"
              label="Credit Score"
              type="number"
              placeholder="e.g., 720"
              min="300"
              max="850"
              required
              helperText="Credit scores range from 300 to 850"
              {...creditScore}
            />

            <CustomInput
              id="income"
              label="Annual Income"
              type="number"
              placeholder="e.g., 75000"
              min="0"
              step="1000"
              required
              helperText="Enter your gross annual income in USD"
              {...income}
            />

            <CustomInput
              id="debtToIncomeRatio"
              label="Debt-to-Income Ratio (%)"
              type="number"
              placeholder="e.g., 35"
              min="0"
              max="100"
              step="0.1"
              required
              helperText="Percentage of monthly income that goes toward debt"
              {...debtToIncomeRatio}
            />

            <div className="financial-info-box">
              <p className="financial-info-title">
                Why do we need this information?
              </p>
              <p className="financial-info-text">
                This helps us provide personalized recommendations. All data is
                encrypted and stored securely.
              </p>
            </div>

            {error && (
              <div className="financial-error-message">
                {error}
              </div>
            )}

            <CustomButton type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Continue'}
            </CustomButton>

            <button
              type="button"
              onClick={() => console.log("Skip for now")}
              className="financial-skip-button"
            >
              Skip for now
            </button>
          </form>

          <div className="financial-footer">
            <p className="financial-footer-text">Your information is protected by industry-standard encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}