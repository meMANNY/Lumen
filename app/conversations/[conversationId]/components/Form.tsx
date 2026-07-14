"use client";

import useConversation from "@/app/hooks/useConversation";
import axios from "axios";
import {  FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPhoto } from "react-icons/hi2";
import MessageInput from "./MessageInput";
import { HiPaperAirplane } from "react-icons/hi2";
import { CldUploadButton } from "next-cloudinary";

const Form = () => {
    const {conversationId} = useConversation();

    const {register, handleSubmit, setValue, 
    formState:{
        errors,
    }} = useForm<FieldValues>({
        defaultValues: {
            message: ''
        }
    })

    const onSubmit: SubmitHandler<FieldValues> = (data) =>{
        setValue('message', '', {shouldValidate: true});
        axios.post('/api/messages' , {
            ...data,
            conversationId
        })
    };

    const handleUpload = (result: any) =>{
        axios.post('/api/messages',{
            image: result?.info?.secure_url,
            conversationId
        })
    }

  return (
    <div 
      className="
        py-4 
        px-4 
        bg-slate-950 
        border-t 
        border-slate-900/50
        flex 
        items-center 
        gap-2 
        lg:gap-4 
        w-full
      "
    >   
        <CldUploadButton
          options={{maxFiles: 1}}
          onSuccess={handleUpload}
          uploadPreset="q4wapwim"    
        >
          <HiPhoto size={30} className="text-slate-400 hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all duration-200" />
        </CldUploadButton>
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="flex items-center gap-2 lg:gap-4 w-full"
        >
          <MessageInput 
              id="message" 
              register={register} 
              errors={errors} 
              required 
              placeholder="Write a message..."
          />
          <button 
            type="submit" 
            className="
              rounded-xl 
              p-2.5 
              bg-indigo-600 
              cursor-pointer 
              hover:bg-indigo-500 
              hover:scale-[1.05]
              active:scale-[0.95]
              transition-all
              duration-200
              shadow-md
              shadow-indigo-900/25
            "
          >
              <HiPaperAirplane
                size ={18}
                className = "text-white"
              />
          </button>
        </form>
    </div>

  )
}

export default Form
