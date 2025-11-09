import { IconCheckCircle } from '../Icons';

export const PasswordRequirement = ({ text }: { text: string }) => (
  <li className="flex items-center text-xs text-gray-500">
    <IconCheckCircle className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
    <span>{text}</span>
  </li>
);

// import { IconCheckCircle } from '../Icons';

// export const PasswordRequirement = ({ text }: { text: string }) => (
//   <li className="flex items-center">
//     <IconCheckCircle className="w-3 h-3 text-gray-400 mr-2" />
//     {text}
//   </li>
// );
