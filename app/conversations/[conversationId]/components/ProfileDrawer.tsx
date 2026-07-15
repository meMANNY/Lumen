'use client';

import Avatar from "@/app/components/Avatar";
import ConfirmModal from "./ConfirmModal";
import useOtherUser from "@/app/hooks/useOtherUser";
import { Dialog, Transition } from "@headlessui/react";
import { Conversation, User } from "@prisma/client";
import { format } from "date-fns";
import { Fragment, useMemo, useState } from "react";
import { IoClose, IoTrash } from 'react-icons/io5';
import AvatarGroup from "@/app/components/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";


interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    data: Conversation & {
        users: User[];
    }
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
    isOpen,
    onClose,
    data
}) => {
    const otherUser = useOtherUser(data);
    const [ConfirmOpen, setConfirmOpen] = useState(false);
    const { members } = useActiveList();
    const isActive = members.indexOf(otherUser?.id!) !== -1;

    const joinedDate = useMemo(() => {
        return format(new Date(otherUser.createdAt), 'PP');
    }, [otherUser.createdAt]);

    const title = useMemo(() => {
        return data.name || otherUser.name;
    }, [data.name, otherUser.name]);

    const statusText = useMemo(() => {
        if (data.isGroup) {
            return `${data.users.length} members`;
        }
        return isActive ? 'Active now' : 'Offline';
    }, [data, isActive])


    return (
        <>
            <ConfirmModal isOpen={ConfirmOpen} onClose={() => setConfirmOpen(false)} />

            <Transition.Root show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10" >
                                <Transition.Child
                                    as={Fragment}
                                    enter="transform transition ease-in-out duration-300"
                                    enterFrom="translate-x-full"
                                    enterTo="translate-x-0"
                                    leave="transform transition ease-in-out duration-300"
                                    leaveFrom="translate-x-0"
                                    leaveTo="translate-x-full"
                                >
                                    <Dialog.Panel className="pointer-events-auto w-screen max-w-md font-sans">
                                        <div className="flex h-full flex-col overflow-y-auto border-l border-white/10 bg-[#10121d]/95 text-slate-100 shadow-[-24px_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-6 pt-6">
                                                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">
                                                    Lumen / profile
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
                                                    aria-label="Close panel"
                                                >
                                                    <IoClose size={20} />
                                                </button>
                                            </div>

                                            <div className="flex flex-1 flex-col items-center px-6 pb-8 pt-10">
                                                {/* Identity */}
                                                <div className="relative">
                                                    {data.isGroup ? (
                                                        <AvatarGroup users={data.users} />
                                                    ) : (
                                                        <Avatar user={otherUser} size="lg" />
                                                    )}
                                                    {isActive && !data.isGroup && (
                                                        <span className="absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-[#10121d] bg-emerald-400 animate-pulse-glow" />
                                                    )}
                                                </div>
                                                <h2 className="mt-4 font-serif text-[26px] font-medium tracking-[-0.02em] text-white">
                                                    {title}
                                                </h2>
                                                <p className={`mt-1 text-xs font-medium ${!data.isGroup && isActive ? 'text-emerald-300' : 'text-slate-500'}`}>
                                                    {statusText}
                                                </p>

                                                {/* Details */}
                                                <div className="mt-9 w-full space-y-7">
                                                    {data.isGroup ? (
                                                        <div>
                                                            <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">
                                                                Members
                                                            </p>
                                                            <div className="mt-4 space-y-2">
                                                                {data.users.map((user) => (
                                                                    <div
                                                                        key={user.id}
                                                                        className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3.5 py-2.5"
                                                                    >
                                                                        <Avatar user={user} size="sm" />
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
                                                                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">
                                                                Details
                                                            </p>
                                                            <div className="mt-4 space-y-3">
                                                                <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-4">
                                                                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-600">Email</p>
                                                                    <p className="mt-1.5 break-all text-sm leading-5 text-slate-200">{otherUser.email}</p>
                                                                </div>
                                                                <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-4">
                                                                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-600">Joined</p>
                                                                    <p className="mt-1.5 text-sm leading-5 text-slate-200">
                                                                        <time dateTime={joinedDate}>{joinedDate}</time>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Danger zone */}
                                                <div className="mt-auto w-full pt-10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmOpen(true)}
                                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 transition-all duration-200 hover:bg-rose-500/20 hover:text-rose-200 active:scale-[0.98]"
                                                    >
                                                        <IoTrash size={16} />
                                                        Delete conversation
                                                    </button>
                                                    <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-slate-600">
                                                        Removes the conversation for everyone
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

        </>
    )
}

export default ProfileDrawer
