import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgetPassword';
import FinancialBg from './pages/FinancialBg';
import HomePage from './pages/HomePage';

export default function App() {
  const [page, setPage] = useState('splash');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication state on mount and on changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsCheckingAuth(false);
      
      if (user) {
        // User is signed in, redirect to home page (unless on financial or splash page)
        setPage((currentPage) => {
          if (currentPage !== 'home' && currentPage !== 'financial' && currentPage !== 'splash') {
            return 'home';
          }
          return currentPage;
        });
      } else {
        // User is signed out, redirect to login (unless already on auth pages)
        setPage((currentPage) => {
          if (currentPage === 'home' || currentPage === 'financial') {
            return 'login';
          }
          return currentPage;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Only show splash screen if not checking auth and not already authenticated
    if (!isCheckingAuth && page === 'splash') {
      const timer = setTimeout(() => {
        // Check if user is authenticated
        if (auth.currentUser) {
          setPage('home');
        } else {
          setPage('login');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [page, isCheckingAuth]);

  const renderPage = () => {
    switch (page) {
      case 'splash':
        return <SplashScreen />;
      case 'login':
        return <Login setPage={setPage} />;
      case 'signup':
        return <Signup setPage={setPage} />;
      case 'forgot':
        return <ForgotPassword setPage={setPage} />;
      case 'financial':
        return <FinancialBg setPage={setPage} />;
      case 'home':
        return <HomePage />;
      default:
        return <Login setPage={setPage} />;
    }
  };

  return (
    <div className="antialiased">
      {renderPage()}
    </div>
  );
}
