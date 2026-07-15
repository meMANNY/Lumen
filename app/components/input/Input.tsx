'use client';
import clsx from "clsx";
import {
    FieldErrors,
    FieldValues,
    UseFormRegister
} from 'react-hook-form';

interface InputProps{
    label: string,
    id: string,
    type?: string,
    required?:boolean,
    register: UseFormRegister<FieldValues>,
    errors: FieldErrors,
    disabled?: boolean,
    autoComplete?: string
}

const Input: React.FC<InputProps> = ({
    label,id,type,required,register,errors,disabled,autoComplete
})=> {
  return (
    <div>
        <label htmlFor= {id} className="block font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">{label}</label>
        <div className="mt-2">
            <input
              id={id}
              type={type}
              autoComplete={autoComplete ?? id}
              disabled = {disabled}
              suppressHydrationWarning
              {...register(id, { required})}
              className= {clsx(`
                form-input
                block
                w-full
                rounded-xl
                border-0
                py-2.5
                bg-black/20
                text-sm
                text-slate-100
                shadow-sm
                ring-1
                ring-inset
                ring-white/[0.08]
                placeholder:text-slate-500
                focus:ring-2
                focus:ring-inset
                focus:ring-violet-400/60
                sm:leading-6
                transition-all
              `,
                errors[id] && "focus:ring-rose-500 ring-rose-500",
                disabled && "opacity-50 cursor-default"
              )}
            />
        </div>
    </div>
  );
}


export default Input