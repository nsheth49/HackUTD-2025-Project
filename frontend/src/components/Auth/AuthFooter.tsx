export const AuthFooter = ({ text, linkText, onLinkClick }: { text: string; linkText: string; onLinkClick: () => void }) => (
  <div className="text-center">
    <p className="text-sm text-gray-600">
      {text}{' '}
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); onLinkClick(); }}
        className="font-medium text-red-600 hover:text-red-500"
      >
        {linkText}
      </a>
    </p>
    <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500">
      <a href="#" className="hover:text-gray-700">Privacy Policy</a>
      <span>&bull;</span>
      <a href="#" className="hover:text-gray-700">Terms of Service</a>
    </div>
  </div>
);

// export const AuthFooter = ({ text, linkText, onLinkClick }: { text: string; linkText: string; onLinkClick: () => void }) => (
//   <div className="text-center">
//     <p className="text-sm text-gray-600">
//       {text}{' '}
//       <a
//         href="#"
//         onClick={(e) => { e.preventDefault(); onLinkClick(); }}
//         className="font-medium text-red-600 hover:text-red-500"
//       >
//         {linkText}
//       </a>
//     </p>
//     <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500">
//       <a href="#" className="hover:text-gray-700">Privacy Policy</a>
//       <span>&bull;</span>
//       <a href="#" className="hover:text-gray-700">Terms of Service</a>
//     </div>
//   </div>
// );
  
