import { IconLock } from '../Icons';

export const AuthHeader = () => (
  <div className="flex flex-col items-center justify-center text-center">
    <div className="bg-red-600 p-3 rounded-lg inline-block mb-3">
      <IconLock className="w-8 h-8 text-white" />
    </div>
    <h1 className="text-2xl font-bold text-gray-900">SecurePortal</h1>
  </div>
);

// import { IconLock } from '../Icons';

// export const AuthHeader = () => (
//   <div className="flex flex-col items-center justify-center text-center">
//     <div className="bg-red-600 p-3 rounded-lg inline-block mb-3">
//       <IconLock className="w-8 h-8 text-white" />
//     </div>
//     <h1 className="text-2xl font-bold text-gray-900">SecurePortal</h1>
//   </div>
// );
