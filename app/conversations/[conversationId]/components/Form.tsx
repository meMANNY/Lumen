"use client";

import useConversation from "@/app/hooks/useConversation";
import useReply from "@/app/hooks/useReply";
import useEdit from "@/app/hooks/useEdit";
import axios from "axios";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Popover } from "@headlessui/react";
import {  FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPhoto } from "react-icons/hi2";
import { HiPaperClip, HiEmojiHappy, HiX, HiOutlineMicrophone, HiStop, HiPencil } from "react-icons/hi";
import MessageInput from "./MessageInput";
import { HiPaperAirplane } from "react-icons/hi2";
import { CldUploadButton } from "next-cloudinary";
import toast from "react-hot-toast";

const EMOJI_SECTIONS: { label: string; emojis: string[] }[] = [
    {
        label: 'Smileys',
        emojis: ['😀','😄','😁','😂','🤣','😊','😍','🥰','😘','😜','🤪','😎','🥳','😇','🙂','🙃','😉','🤗','🤔','🫡','😴','🥺','😢','😭','😤','😅','😬','🙄','😮','🤯'],
    },
    {
        label: 'Gestures',
        emojis: ['👍','👎','👌','✌️','🤞','🤟','🤙','👏','🙌','🙏','💪','🫶','🤝','👋','✋','🖐️','☝️','👉','👈','🫰'],
    },
    {
        label: 'Hearts',
        emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💕','💞','💓','💗','💖','💘','💝'],
    },
    {
        label: 'Fun',
        emojis: ['🔥','✨','⭐','🎉','🎊','🎁','🏆','⚡','🌟','🌈','☀️','🌙','🍕','🍔','☕','🍺','⚽','🎮','🎧','🚀'],
    },
];

const Form = () => {
    const {conversationId} = useConversation();
    const formRef = useRef<HTMLFormElement>(null);

    const {register, handleSubmit, setValue, getValues, watch,
    formState:{
        errors,
    }} = useForm<FieldValues>({
        defaultValues: {
            message: ''
        }
    })

    const { replyTo, clear: clearReply } = useReply();
    const { editing, clear: clearEdit } = useEdit();
    const messageValue = watch('message');
    const lastTypingSentRef = useRef(0);

    const [isRecording, setIsRecording] = useState(false);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Stale reply/edit targets must not leak into another conversation
    useEffect(() => {
        clearReply();
        clearEdit();
    }, [conversationId, clearReply, clearEdit]);

    // Entering edit mode prefills the input and cancels any pending reply
    useEffect(() => {
        if (editing) {
            clearReply();
            setValue('message', editing.body || '', { shouldValidate: true });
            document.getElementById('message')?.focus();
        }
    }, [editing, clearReply, setValue]);

    // Throttled typing signal (at most one every 1.5s while typing)
    useEffect(() => {
        if (!messageValue?.trim()) {
            return;
        }
        const now = Date.now();
        if (now - lastTypingSentRef.current < 1500) {
            return;
        }
        lastTypingSentRef.current = now;
        axios.post(`/api/conversations/${conversationId}/typing`).catch(() => {});
    }, [messageValue, conversationId]);

    const insertEmoji = (emoji: string) => {
        setValue('message', (getValues('message') || '') + emoji, { shouldValidate: true });
        document.getElementById('message')?.focus();
    };

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
        // Edit mode replaces the message body instead of sending a new one
        if (editing) {
            const editingId = editing.id;
            clearEdit();
            setValue('message', '', {shouldValidate: true});
            try {
                await axios.post(`/api/messages/${editingId}/edit`, { message: data.message });
            } catch (error: any) {
                toast.error(error?.response?.data?.message || "Couldn't edit message");
            }
            return;
        }

        const replyToId = replyTo?.id;
        clearReply();
        setValue('message', '', {shouldValidate: true});
        try {
            await axios.post('/api/messages', {
                ...data,
                conversationId,
                replyToId
            });
        } catch {
            toast.error('Message failed to send');
            setValue('message', data.message);
        }
    };

    const handleUpload = async (result: any) => {
        const replyToId = replyTo?.id;
        clearReply();
        const info = result?.info;
        if (!info?.secure_url) {
            return;
        }

        // Images become image bubbles; everything else becomes a file card
        const isImage = info.resource_type === 'image' && info.format !== 'pdf';
        const payload = isImage
            ? { image: info.secure_url }
            : {
                fileUrl: info.secure_url,
                fileName: info.original_filename
                  ? `${info.original_filename}${info.format ? `.${info.format}` : ''}`
                  : 'File',
                fileType: info.format || info.resource_type || 'file',
              };

        try {
            await axios.post('/api/messages', {
                ...payload,
                conversationId,
                replyToId
            });
        } catch {
            toast.error('Attachment failed to send');
        }
    }

    const startRecording = async () => {
        if (isRecording || isUploadingAudio) {
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                if (blob.size === 0) {
                    return;
                }

                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
                if (!cloudName || !preset) {
                    toast.error('Cloudinary is not configured for audio uploads');
                    return;
                }

                setIsUploadingAudio(true);
                try {
                    const formData = new FormData();
                    formData.append('file', blob, 'voice-note.webm');
                    formData.append('upload_preset', preset);
                    const { data: uploaded } = await axios.post(
                        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
                        formData
                    );
                    await axios.post('/api/messages', {
                        audio: uploaded.secure_url,
                        conversationId
                    });
                } catch {
                    toast.error("Couldn't send voice note");
                } finally {
                    setIsUploadingAudio(false);
                }
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
        } catch {
            toast.error('Microphone access was denied');
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current = null;
        setIsRecording(false);
    };

  return (
    <footer className="px-5 pb-5 pt-2 sm:px-8 sm:pb-8 shrink-0 w-full bg-transparent">
      <div className="mx-auto max-w-3xl rounded-[22px] border border-white/[0.09] bg-[#0a0c15]/75 p-2 shadow-2xl shadow-black/20 transition focus-within:border-violet-300/35 focus-within:shadow-violet-950/20">
        {editing && (
          <div className="mb-1.5 flex items-center gap-3 rounded-xl border-l-2 border-amber-300 bg-white/[0.04] px-3 py-2">
            <HiPencil className="size-3.5 shrink-0 text-amber-300" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber-200">
                Editing message
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{editing.body}</p>
            </div>
            <button
              type="button"
              onClick={() => { clearEdit(); setValue('message', '', { shouldValidate: true }); }}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Cancel edit"
            >
              <HiX size={14} />
            </button>
          </div>
        )}
        {replyTo && !editing && (
          <div className="mb-1.5 flex items-center gap-3 rounded-xl border-l-2 border-violet-300 bg-white/[0.04] px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-violet-200">
                Replying to {replyTo.sender?.name || 'message'}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {replyTo.image ? '📷 Photo' : replyTo.body}
              </p>
            </div>
            <button
              type="button"
              onClick={clearReply}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Cancel reply"
            >
              <HiX size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <CldUploadButton
            options={{ maxFiles: 1, resourceType: 'auto' }}
            onSuccess={handleUpload}
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white/[0.07] hover:text-violet-200" aria-label="Attach file">
              <HiPaperClip size={18} />
            </div>
          </CldUploadButton>

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploadingAudio}
            className={clsx(
              "grid size-10 shrink-0 place-items-center rounded-xl transition",
              isRecording
                ? "animate-pulse bg-rose-500/20 text-rose-300"
                : "text-slate-500 hover:bg-white/[0.07] hover:text-rose-200",
              isUploadingAudio && "opacity-50"
            )}
            aria-label={isRecording ? 'Stop recording' : 'Record voice note'}
          >
            {isRecording ? <HiStop size={18} /> : <HiOutlineMicrophone size={18} />}
          </button>
          
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
            <Popover className="relative">
              <Popover.Button
                suppressHydrationWarning
                className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 outline-none transition hover:bg-white/[0.07] hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-violet-400/50"
                aria-label="Add emoji"
              >
                <HiEmojiHappy size={18} />
              </Popover.Button>
              <Popover.Panel
                className="
                  absolute
                  bottom-12
                  right-0
                  z-30
                  w-[286px]
                  max-h-72
                  overflow-y-auto
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#191c2a]/95
                  p-3
                  shadow-xl
                  shadow-black/50
                  backdrop-blur-xl
                "
              >
                {EMOJI_SECTIONS.map((section) => (
                  <div key={section.label} className="mb-2 last:mb-0">
                    <p className="px-1 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
                      {section.label}
                    </p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {section.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="grid size-8 place-items-center rounded-lg text-lg transition hover:bg-white/[0.09] active:scale-90"
                          aria-label={`Insert ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </Popover.Panel>
            </Popover>
            <button
              type="submit"
              suppressHydrationWarning
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
