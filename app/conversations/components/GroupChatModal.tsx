"use client";

import Button from "@/app/components/Button";
import Input from "@/app/components/input/Input";
import Select from "@/app/components/input/Select";
import Modal from "@/app/components/Modal";
import { User } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface GroupChatModalProps{
    isOpen?: boolean;
    onClose: () => void;
    users: User[];
}


const GroupChatModal: React.FC<GroupChatModalProps> = ({isOpen, onClose,users}) => {

    const router = useRouter();
    const [isLoading, setIsLoading]  = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState:{
            errors
        } }= useForm<FieldValues>({
            defaultValues: {
                name: '',
                members: []
            }});

    const members = watch('members');
    const onSubmit: SubmitHandler<FieldValues> = (data)=>{
        if (!data.members || data.members.length < 2) {
            toast.error('Select at least 2 members for a group');
            return;
        }

        setIsLoading(true);

        axios.post('/api/conversations', {
            ...data,
            isGroup: true
        })
        .then(()=>{
            router.refresh();
            onClose();
        })
        .catch((error)=> {
            const response = error?.response?.data;
            const message = typeof response === 'string' ? response : response?.message;
            toast.error(message || 'Something went wrong');
        })
        .finally(()=> setIsLoading(false));
    }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <div className="border-b border-white/[0.07] pb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">
              Lumen / new group
            </p>
            <h2 className="mt-2 font-serif text-[24px] font-medium tracking-[-0.02em] text-white">
              Create a group chat
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Create a chat with more than 2 people.
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
                <Select
                  disabled={isLoading}
                  label="Members"
                  options={users.map((user) => ({
                    value: user.id,
                    label: user.name
                  }))}
                  onChange={(value) => setValue('members', value, {
                    shouldValidate: true
                  })}
                  value={members}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Pick at least 2 people — smaller chats live in the directory.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <Button
            disabled={isLoading}
            onClick={onClose} 
            type="button"
            secondary
          >
            Cancel
          </Button>
          <Button disabled={isLoading} type="submit">
            Create
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default GroupChatModal
