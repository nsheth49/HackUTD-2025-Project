import React from 'react';

export const SocialButton = ({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
  >
    <span className="flex items-center justify-center">{icon}</span>
    <span className="ml-2 text-sm font-medium text-gray-700">{text}</span>
  </button>
);

// import React from 'react';

// export const SocialButton = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
//   <button
//     type="button"
//     className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
//   >
//     {icon}
//     <span className="ml-2 text-sm font-medium text-gray-700">{text}</span>
//   </button>
// );
  