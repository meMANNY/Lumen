"use client";

import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

interface MessageInputProps{
    placeholder?: string;
    id: string;
    type?: string;
    required?: boolean;
    register: UseFormRegister<FieldValues>;
    errors: FieldErrors
}

const MessageInput: React.FC<MessageInputProps> = ({
    placeholder,
    id,
    type,
    required,
    register,
    errors 
}) => {
  return (
    <div className=" relative w-full">
        <input 
          id={id}
          type={type}
          autoComplete={id}
          {...register(id, {required})}
          placeholder={placeholder}
          className="
            text-slate-100 
            font-normal 
            py-2.5 
            px-4 
            bg-slate-900 
            border 
            border-slate-800/80
            w-full 
            rounded-xl 
            placeholder:text-slate-500
            focus:outline-none 
            focus:border-indigo-500/80
            focus:ring-1
            focus:ring-indigo-500/80
            transition-all
            duration-200
          "
        />
    </div>
  )
}

export default MessageInput
