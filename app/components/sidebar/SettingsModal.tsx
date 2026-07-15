"use client";

import { User } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "../Modal";
import Input from "../input/Input";
import Image from "next/image";
import { CldUploadButton } from "next-cloudinary";
import Button from "../Button";
import { gradientFor, initialsFor } from "@/app/libs/avatar";
import clsx from "clsx";

interface SettingsModalProps{
    isOpen?: boolean;
    onClose: ()=> void;
    currentUser: User;

}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, currentUser
}) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register, handleSubmit, setValue, watch , formState:{errors}
    } = useForm<FieldValues>({
        defaultValues:{
            name: currentUser?.name,
            image: currentUser?.image
        }
    });

    const image = watch('image');

    const handleUpload = (result: any)=>{
        setValue('image' , result?.info?.secure_url, {
            shouldValidate: true
        })
    };
    
    const onSubmit: SubmitHandler<FieldValues> = (data)=>{
        setIsLoading(true);

        axios.post('/api/settings' ,data)
        .then(()=>{
            router.refresh();
            onClose();
        })
        .catch(() => toast.error('something went wrong'))
        .finally(()=> setIsLoading(false))
    }

  return (
   <Modal isOpen = {isOpen} onClose={onClose}>
    <form onSubmit={handleSubmit(onSubmit)}>
    <div>
          <div className="border-b border-white/[0.07] pb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">
              Lumen / settings
            </p>
            <h2 className="mt-2 font-serif text-[24px] font-medium tracking-[-0.02em] text-white">
              Profile
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Edit your public information.
            </p>

            <div className="mt-8 flex flex-col gap-y-6">
              <Input
                disabled={isLoading}
                label="Name"
                id="name"
                errors={errors}
                required
                register={register}
              />
              <div>
                <label
                  htmlFor="photo"
                  className="block font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400"
                >
                  Photo
                </label>
                <div className="mt-3 flex items-center gap-x-4">
                  {(image || currentUser?.image) ? (
                    <Image
                      width="48"
                      height="48"
                      className="size-12 rounded-full object-cover ring-1 ring-white/10"
                      src={image || currentUser?.image}
                      alt="Avatar"
                    />
                  ) : (
                    <div
                      className={clsx(
                        "flex size-12 items-center justify-center rounded-full text-[15px] font-semibold text-white ring-1 ring-white/10",
                        gradientFor(currentUser)
                      )}
                    >
                      {initialsFor(currentUser)}
                    </div>
                  )}
                  <CldUploadButton
                    options={{ maxFiles: 1 }}
                    onSuccess={handleUpload}
                    uploadPreset="q4wapwim"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.09] hover:text-white"
                  >
                    Change
                  </CldUploadButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="
            mt-6 
            flex 
            items-center 
            justify-end 
            gap-x-6
          "
        >
          <Button 
            disabled={isLoading}
            secondary 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            disabled={isLoading}
            type="submit"
          >
            Save
          </Button>
        </div>
    </form>
   </Modal>
  )
}

export default SettingsModal
