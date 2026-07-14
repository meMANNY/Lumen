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
            w-full
            bg-transparent 
            py-2.5 
            px-2
            text-sm 
            leading-5 
            text-slate-100 
            outline-none 
            placeholder:text-slate-600
            border-0
            focus:ring-0
            focus:outline-none
          "
        />
    </div>
  )
}

export default MessageInput
