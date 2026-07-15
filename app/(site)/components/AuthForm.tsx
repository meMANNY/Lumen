'use client';

import clsx from "clsx";
import Button from "@/app/components/Button";
import Input from "@/app/components/input/Input";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import AuthSocialButton from "./AuthSocialButton";
import {BsGithub, BsGoogle} from 'react-icons/bs';
import axios from "axios";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Variant = "LOGIN" | "REGISTER";


export default function AuthForm() {
    const session = useSession();
    const router = useRouter();
    const [variant, setVariant] = useState<Variant>('LOGIN');
    const [isLoading,setIsLoading] = useState(false);

    useEffect(()=>{
        if(session?.status === "authenticated") {
            console.log("authenticated");
            router.push('/users');
        }
    },[session?.status, router]);



    const toggleVariant  = useCallback(()=>{
        if(variant == "LOGIN")
       { setVariant('REGISTER');}
       else
       setVariant("LOGIN");
    },[variant]);

    const {
        register,
        handleSubmit,
        formState:{
            errors,
        }
    } = useForm<FieldValues>({
        defaultValues:{
            name: '',
            email: '',
            password: ""
        }
    })

    const onSubmit: SubmitHandler<FieldValues> = (data)=>{
        setIsLoading(true);

        if(variant == "REGISTER")
        { axios.post('/api/register',data)
            .then(()=> signIn('credentials', data))
            .catch((error)=> {
                const data = error?.response?.data;
                const message = typeof data === 'string' ? data : data?.message;
                toast.error(message || 'Something went wrong');
            })
            .finally(()=> setIsLoading(false))
        }
        if(variant == "LOGIN")
        {
            signIn("credentials", {
                ...data,
                redirect: false
            })
            .then((callback) =>{
                if(callback?.error){
                    toast.error('invalid credentials');
                }
                if(callback?.ok && !callback?.error){
                    toast.success("Logged In")
                    router.push('/users');
                }

            })
            .finally(()=> setIsLoading(false))
        }
    }

    const socialAction = (action: string) =>{
        setIsLoading(true);
        signIn(action, { redirectTo: '/users' })
            .catch(() => {
                toast.error('Something went wrong');
                setIsLoading(false);
            });
    }

  return (
    <div className="relative z-10 w-full sm:mx-auto sm:max-w-md [animation:auth-rise_0.45s_ease-out_both]">
        <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">Lumen / access</p>
            <h1 className="mt-2.5 font-serif text-[34px] font-medium tracking-[-0.025em] text-white">
                {variant == "LOGIN" ? 'Welcome back' : 'Create your space'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
                {variant == "LOGIN"
                  ? 'Sign in to pick up your conversations.'
                  : 'A calm home for your conversations.'}
            </p>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-[#10121d]/85 px-6 py-8 shadow-[0_24px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-10">
            <form className="space-y-5"
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}>
                <div className={clsx(
                  "grid transition-all duration-300 ease-out",
                  variant == 'REGISTER' ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}>
                    <div className="overflow-hidden" inert={variant == 'LOGIN' ? true : undefined}>
                        <div className="pb-1">
                            <Input id = "name" label = "Name" register={register} errors= {errors}/>
                        </div>
                    </div>
                </div>

                <Input id = "email" label = "Email address" type = "email" autoComplete="off" register={register} errors= {errors}/>
                <Input id = "password" label = "Password" type = "password" autoComplete="new-password" register={register} errors= {errors}/>
                <div className="pt-2">
                    <Button disabled = {isLoading} fullWidth type="submit"> {variant == "LOGIN" ? 'Sign in' : "Create account"}</Button>
                </div>
            </form>

            <div className="mt-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">or continue with</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <AuthSocialButton icon={BsGithub} label="GitHub" onClick={()=> socialAction('github')}/>
                <AuthSocialButton icon={BsGoogle} label="Google" onClick={()=> socialAction('google')}/>
            </div>

            <div className="flex gap-2 justify-center text-sm mt-7 px-2 text-slate-400">
                <div>
                    {variant == "LOGIN" ? "New to Lumen?" : "Already have an account?"}
                </div>
                <button type="button" onClick={toggleVariant} className="text-violet-300 hover:text-violet-200 transition-colors underline underline-offset-4 cursor-pointer font-semibold">
                    {variant == "LOGIN" ? "Create an account" : "Sign in"}
                </button>
            </div>
        </div>

        <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">
            Conversations · calm by design
        </p>
    </div>
  )
}

