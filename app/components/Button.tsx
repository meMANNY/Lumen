'use client';

import clsx from "clsx";

interface ButtonProps{
    type?: 'button' | 'submit' | 'reset' | undefined;
    fullWidth?: boolean;
    children?: React.ReactNode;
    onClick?: ()=> void;
    secondary?: boolean;
    danger?: boolean;
    disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({type, fullWidth, children, onClick, secondary, danger, disabled}) => {
  return (
   <button 
     onClick={onClick} 
     type={type} 
     disabled={disabled} 
     className={clsx(`
       flex 
       justify-center 
       rounded-lg 
       px-4 
       py-2.5 
       text-sm 
       font-semibold 
       transition-all 
       duration-200 
       active:scale-[0.98] 
       focus-visible:outline 
       focus-visible:outline-2 
       focus-visible:outline-offset-2
     `, 
       disabled && "opacity-50 cursor-default active:scale-100", 
       fullWidth && "w-full", 
       secondary ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 focus-visible:outline-slate-700" : 'text-white', 
       danger && "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-900/20 focus-visible:outline-rose-500", 
       !secondary && !danger && "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-900/20 focus-visible:outline-indigo-500"
     )}
   >
    {children}
   </button>
  )
}


export default Button

