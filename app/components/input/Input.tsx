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
    disabled?: boolean 
}

const Input: React.FC<InputProps> = ({
    label,id,type,required,register,errors,disabled
})=> {
  return (
    <div>
        <label htmlFor= {id} className="block text-sm font-medium leading-6 text-slate-300">{label}</label>
        <div className="mt-1.5">
            <input 
              id={id} 
              type={type} 
              autoComplete={id} 
              disabled = {disabled} 
              {...register(id, { required})} 
              className= {clsx(`
                form-input 
                block 
                w-full 
                rounded-lg 
                border-0 
                py-2
                bg-slate-950/60
                text-slate-100 
                shadow-sm 
                ring-1 
                ring-inset 
                ring-slate-800/80 
                placeholder:text-slate-500 
                focus:ring-2 
                focus:ring-inset 
                focus:ring-indigo-500 
                sm:text-sm 
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