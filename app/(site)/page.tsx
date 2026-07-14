import Image from "next/image"
import AuthForm from "./components/AuthForm"

export default function Home() {
  return (
   <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">  
        <Image 
        alt= "Logo" 
        height= "56"
        width= "56"
        className= "mx-auto w-auto hover:scale-105 transition-transform duration-300"
        src= "/images/logo.png"
        />
        <h2
        className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-200">
          Sign in to your account
        </h2>
    </div>
    <AuthForm/>
   </div>
  )
}

