"use client";

import useConversation from "@/app/hooks/useConversation";
import axios from "axios";
import { useRef } from "react";
import {  FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPhoto } from "react-icons/hi2";
import { HiPaperClip, HiEmojiHappy } from "react-icons/hi";
import MessageInput from "./MessageInput";
import { HiPaperAirplane } from "react-icons/hi2";
import { CldUploadButton } from "next-cloudinary";
import toast from "react-hot-toast";

const Form = () => {
    const {conversationId} = useConversation();
    const formRef = useRef<HTMLFormElement>(null);

    const {register, handleSubmit, setValue,
    formState:{
        errors,
    }} = useForm<FieldValues>({
        defaultValues: {
            message: ''
        }
    })

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
        setValue('message', '', {shouldValidate: true});
        try {
            await axios.post('/api/messages', {
                ...data,
                conversationId
            });
        } catch {
            toast.error('Message failed to send');
            setValue('message', data.message);
        }
    };

    const handleUpload = async (result: any) => {
        try {
            await axios.post('/api/messages', {
                image: result?.info?.secure_url,
                conversationId
            });
        } catch {
            toast.error('Image failed to send');
        }
    }

  return (
    <footer className="px-5 pb-5 pt-2 sm:px-8 sm:pb-8 shrink-0 w-full bg-transparent">
      <div className="mx-auto max-w-3xl rounded-[22px] border border-white/[0.09] bg-[#0a0c15]/75 p-2 shadow-2xl shadow-black/20 transition focus-within:border-violet-300/35 focus-within:shadow-violet-950/20">
        <div className="flex items-center gap-1">
          <CldUploadButton
            options={{maxFiles: 1}}
            onSuccess={handleUpload}
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white/[0.07] hover:text-violet-200" aria-label="Attach file">
              <HiPaperClip size={18} />
            </div>
          </CldUploadButton>
          
          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 flex items-end gap-2"
          >
            <MessageInput
                id="message"
                register={register}
                errors={errors}
                required
                placeholder="Write a message..."
                onEnter={() => formRef.current?.requestSubmit()}
            />
            <button className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white/[0.07] hover:text-amber-200" type="button" aria-label="Add emoji">
              <HiEmojiHappy size={18} />
            </button>
            <button 
              type="submit" 
              className="
                grid 
                size-10 
                shrink-0 
                place-items-center 
                rounded-xl 
                bg-violet-300 
                text-violet-950 
                shadow-lg 
                shadow-violet-950/20 
                transition-all
                duration-200
                hover:scale-[1.04] 
                hover:bg-violet-200 
                active:scale-95
              "
              aria-label="Send message"
            >
                <HiPaperAirplane
                  size ={18}
                  className="text-violet-950"
                />
            </button>
          </form>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-3xl text-center font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">Enter to send · Shift + Enter for a new line</p>
    </footer>
  )
}

export default Form
