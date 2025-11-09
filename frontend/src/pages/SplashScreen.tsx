import { IconLock } from '../components/Icons';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="bg-red-600 p-3 rounded-lg mb-3 splash-icon-container">
          <IconLock className="w-8 h-8 text-white" />
        </div>
        <h1 className="splash-title">Toyota NextAI</h1>
        <p className="splash-tagline">Your trusted recommendation platform</p>
        <div className="splash-loading">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

// // src/components/SplashScreen.tsx
// import React from 'react';
// import './SplashScreen.css';

// const SplashScreen: React.FC = () => {
//   return (
//     <div className="splash-screen">
//       <h1 className="splash-title">Toyo 67</h1>
//     </div>
//   );
// };

// export default SplashScreen;