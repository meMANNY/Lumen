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
     suppressHydrationWarning
     className={clsx(`
       flex
       justify-center
       rounded-xl
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
       secondary && "bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 border border-white/10 focus-visible:outline-slate-500",
       danger && "bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-950/30 focus-visible:outline-rose-500",
       !secondary && !danger && "bg-violet-400 hover:bg-violet-300 text-[#171222] shadow-lg shadow-violet-950/40 focus-visible:outline-violet-400"
     )}
   >
    {children}
   </button>
  )
}


export default Button

