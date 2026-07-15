"use client";

import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

interface MessageInputProps{
    placeholder?: string;
    id: string;
    required?: boolean;
    register: UseFormRegister<FieldValues>;
    errors: FieldErrors;
    onEnter?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
    placeholder,
    id,
    required,
    register,
    errors,
    onEnter
}) => {
  return (
    <div className=" relative w-full">
        <textarea
          id={id}
          rows={1}
          suppressHydrationWarning
          autoComplete={id}
          {...register(id, {required})}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onEnter?.();
            }
          }}
          className="
            w-full
            max-h-32
            resize-none
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
