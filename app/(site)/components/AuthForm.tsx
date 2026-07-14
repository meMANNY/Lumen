'use client';

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
            .catch(()=> toast.error('Something went wrong'))
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
        signIn(action, {redirect: false })
        .then((callback) =>{
            if(callback?.error){
                toast.error('invalid credentials');
            }
            if(callback?.ok && !callback?.error){
                toast.success("Logged In");
                router.push('/users');
            }

        })
        .finally(()=> setIsLoading(false))


    }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl px-6 py-8 shadow-2xl sm:rounded-2xl sm:px-10">
            <form className="space-y-5"
            onSubmit={handleSubmit(onSubmit)}>
               { variant == 'REGISTER' && (
                <Input id = "name" label = "Name" register={register} errors= {errors}/>)}

                <Input id = "email" label = "Email address" type = "email" register={register} errors= {errors}/>
                <Input id = "password" label = "Password" type = "password" register={register} errors= {errors}/>
                <div className="pt-2">
                    <Button disabled = {isLoading} fullWidth type="submit"> {variant == "LOGIN" ? 'Sign in' : "Register"}</Button>
                </div>
            </form>
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"> 
                        <div className=" w-full border-t border-slate-800/80"/>
                    </div>
                    <div className=" relative flex justify-center text-sm">
                            <span className=" bg-[#0d1323] px-3 py-0.5 rounded-full text-xs border border-slate-800 text-slate-400"> or Continue with</span>
                    </div>
                
                </div>
                <div className=" mt-6 flex gap-3">
                    <AuthSocialButton icon={BsGithub} onClick={()=> socialAction('github')}/>
                    <AuthSocialButton icon={BsGoogle} onClick={()=> socialAction('google')}/>
                </div>
            </div>

            <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-slate-400">
                <div>
                    {variant == "LOGIN" ? "New to Messenger?" : "Already have an account?"}
                </div>
                <div onClick={toggleVariant} className="text-indigo-400 hover:text-indigo-300 transition-colors underline cursor-pointer font-semibold">
                    {variant == "LOGIN" ? "Create an account" : "Login"}
                </div>
            </div>
        </div>
      
    </div>
  )
}

