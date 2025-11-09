import React from 'react';

export const InputGroup = ({ 
  label, 
  id, 
  type, 
  placeholder, 
  icon, 
  suffix, 
  ...props 
}: { 
  label: string; 
  id: string; 
  type?: string; 
  placeholder?: string; 
  icon?: React.ReactNode; 
  suffix?: React.ReactNode; 
  [key: string]: any;
}) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required
        className={`block w-full ${icon ? 'pl-10' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'} py-3 bg-gray-100 border border-transparent rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white text-gray-900 placeholder-gray-400 transition-all outline-none`}
        {...props}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {suffix}
        </div>
      )}
    </div>
  </div>
);


// import React from 'react';

// export const InputGroup = ({ label, id, type, placeholder, icon, suffix, ...props }: any) => (
//   <div>
//     <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
//     <div className="relative">
//       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//         {icon}
//       </div>
//       <input
//         id={id}
//         name={id}
//         type={type}
//         placeholder={placeholder}
//         required
//         className="block w-full pl-10 pr-10 py-3 bg-gray-100 border-transparent rounded-lg focus:ring-red-500 focus:border-red-500 focus:bg-white text-gray-900"
//         {...props}
//       />
//       {suffix && (
//         <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//           {suffix}
//         </div>
//       )}
//     </div>
//   </div>
// );
    