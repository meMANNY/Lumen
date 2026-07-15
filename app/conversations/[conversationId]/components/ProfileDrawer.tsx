'use client';

import Avatar from "@/app/components/Avatar";
import ConfirmModal from "./ConfirmModal";
import useOtherUser from "@/app/hooks/useOtherUser";
import { Dialog, Transition } from "@headlessui/react";
import { Conversation, User } from "@prisma/client";
import { format } from "date-fns";
import { Fragment, useEffect, useMemo, useState } from "react";
import { IoClose, IoTrash } from 'react-icons/io5';
import { HiOutlineUserPlus, HiOutlineUserMinus, HiOutlineShieldCheck, HiOutlineBell, HiOutlineBellSlash, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import useWallpaper, { WALLPAPERS } from "@/app/hooks/useWallpaper";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import AvatarGroup from "@/app/components/AvatarGroup";
import Select from "@/app/components/input/Select";
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

    const router = useRouter();
    const session = useSession();
    const currentUserId = session.data?.user?.id;

    const adminIds = data.adminIds ?? [];
    const isAdmin = !!data.isGroup && !!currentUserId && adminIds.includes(currentUserId);

    const [addOpen, setAddOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<Record<string, any>[]>([]);
    const [isMutating, setIsMutating] = useState(false);

    // Load the directory when the add-members panel opens
    useEffect(() => {
        if (!addOpen) {
            return;
        }
        axios.get('/api/users')
            .then((response) => setAllUsers(response.data))
            .catch(() => toast.error("Couldn't load users"));
    }, [addOpen]);

    const memberOptions = useMemo(() =>
        allUsers
            .filter((user) => !data.users.some((member) => member.id === user.id))
            .map((user) => ({ value: user.id, label: user.name || user.email || 'Unknown' })),
        [allUsers, data.users]
    );

    const handleAddMembers = () => {
        if (selectedMembers.length === 0 || isMutating) {
            return;
        }
        setIsMutating(true);
        axios.post(`/api/conversations/${data.id}/members`, {
            action: 'add',
            members: selectedMembers
        })
            .then(() => {
                toast.success('Members added');
                setAddOpen(false);
                setSelectedMembers([]);
                router.refresh();
            })
            .catch((error) => toast.error(error?.response?.data?.message || 'Something went wrong'))
            .finally(() => setIsMutating(false));
    };

    const isMuted = (data.mutedByIds ?? []).includes(currentUserId || '');
    const wallpaperKey = useWallpaper((state) => state.byConversation[data.id]) || 'default';
    const setWallpaper = useWallpaper((state) => state.setWallpaper);
    const hydrateWallpaper = useWallpaper((state) => state.hydrate);

    useEffect(() => {
        hydrateWallpaper(data.id);
    }, [data.id, hydrateWallpaper]);

    const toggleMute = () => {
        if (isMutating) {
            return;
        }
        setIsMutating(true);
        axios.post(`/api/conversations/${data.id}/mute`, { muted: !isMuted })
            .then(() => {
                toast.success(isMuted ? 'Notifications unmuted' : 'Conversation muted');
                router.refresh();
            })
            .catch(() => toast.error('Something went wrong'))
            .finally(() => setIsMutating(false));
    };

    const handlePromote = (userId: string) => {
        if (isMutating) {
            return;
        }
        setIsMutating(true);
        axios.post(`/api/conversations/${data.id}/members`, { action: 'promote', userId })
            .then(() => {
                toast.success('Admin added');
                router.refresh();
            })
            .catch((error) => toast.error(error?.response?.data?.message || 'Something went wrong'))
            .finally(() => setIsMutating(false));
    };

    const handleLeaveGroup = () => {
        if (isMutating) {
            return;
        }
        setIsMutating(true);
        axios.post(`/api/conversations/${data.id}/members`, { action: 'leave' })
            .then(() => {
                toast.success('You left the group');
                router.push('/conversations');
                router.refresh();
            })
            .catch((error) => toast.error(error?.response?.data?.message || 'Something went wrong'))
            .finally(() => setIsMutating(false));
    };

    const handleRemoveMember = (userId: string) => {
        if (isMutating) {
            return;
        }
        setIsMutating(true);
        axios.post(`/api/conversations/${data.id}/members`, {
            action: 'remove',
            userId
        })
            .then(() => {
                toast.success('Member removed');
                router.refresh();
            })
            .catch((error) => toast.error(error?.response?.data?.message || 'Something went wrong'))
            .finally(() => setIsMutating(false));
    };

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
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">
                                                                    Members
                                                                </p>
                                                                {isAdmin && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setAddOpen((open) => !open)}
                                                                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.13em] text-violet-200 transition hover:bg-white/[0.06]"
                                                                    >
                                                                        <HiOutlineUserPlus className="size-3.5" />
                                                                        Add
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {isAdmin && addOpen && (
                                                                <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                                                                    <Select
                                                                        disabled={isMutating}
                                                                        label="Add members"
                                                                        options={memberOptions}
                                                                        onChange={(value) => setSelectedMembers(value as Record<string, any>[])}
                                                                        value={selectedMembers}
                                                                    />
                                                                    <div className="mt-3 flex justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { setAddOpen(false); setSelectedMembers([]); }}
                                                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleAddMembers}
                                                                            disabled={selectedMembers.length === 0 || isMutating}
                                                                            className="rounded-lg bg-violet-400 px-3.5 py-1.5 text-xs font-semibold text-[#171222] transition hover:bg-violet-300 disabled:opacity-40 disabled:hover:bg-violet-400"
                                                                        >
                                                                            Add to group
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="mt-4 space-y-2">
                                                                {data.users.map((user) => (
                                                                    <div
                                                                        key={user.id}
                                                                        className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3.5 py-2.5"
                                                                    >
                                                                        <Avatar user={user} size="sm" />
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
                                                                                {adminIds.includes(user.id) && (
                                                                                    <span className="rounded border border-violet-300/30 bg-violet-400/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.13em] text-violet-200">
                                                                                        Admin
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                                                                        </div>
                                                                        {isAdmin && !adminIds.includes(user.id) && (
                                                                            <div className="flex shrink-0 items-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handlePromote(user.id)}
                                                                                    disabled={isMutating}
                                                                                    title="Make admin"
                                                                                    className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-violet-400/15 hover:text-violet-200 disabled:opacity-40"
                                                                                    aria-label={`Make ${user.name} an admin`}
                                                                                >
                                                                                    <HiOutlineShieldCheck className="size-4" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveMember(user.id)}
                                                                                    disabled={isMutating}
                                                                                    title="Remove from group"
                                                                                    className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-40"
                                                                                    aria-label={`Remove ${user.name} from group`}
                                                                                >
                                                                                    <HiOutlineUserMinus className="size-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
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

                                                {/* Preferences */}
                                                <div className="mt-7 w-full">
                                                    <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">
                                                        Preferences
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={toggleMute}
                                                        disabled={isMutating}
                                                        className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.035] px-3.5 py-3 transition hover:bg-white/[0.06] disabled:opacity-50"
                                                    >
                                                        <span className="flex items-center gap-2.5 text-sm text-slate-200">
                                                            {isMuted
                                                              ? <HiOutlineBellSlash className="size-4 text-slate-400" />
                                                              : <HiOutlineBell className="size-4 text-slate-400" />}
                                                            Mute notifications
                                                        </span>
                                                        <span className={clsx(
                                                            "relative h-5 w-9 rounded-full transition-colors",
                                                            isMuted ? "bg-violet-400" : "bg-white/[0.1]"
                                                        )}>
                                                            <span className={clsx(
                                                                "absolute top-0.5 size-4 rounded-full bg-white transition-all",
                                                                isMuted ? "left-[18px]" : "left-0.5"
                                                            )} />
                                                        </span>
                                                    </button>

                                                    <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3.5 py-3">
                                                        <p className="text-sm text-slate-200">Chat wallpaper</p>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {Object.entries(WALLPAPERS).map(([key, wallpaper]) => (
                                                                <button
                                                                    key={key}
                                                                    type="button"
                                                                    onClick={() => setWallpaper(data.id, key)}
                                                                    title={wallpaper.label}
                                                                    aria-label={`Wallpaper: ${wallpaper.label}`}
                                                                    className={clsx(
                                                                        "size-9 rounded-lg border transition",
                                                                        wallpaper.swatch,
                                                                        wallpaperKey === key
                                                                          ? "border-violet-300 ring-2 ring-violet-400/30"
                                                                          : "border-white/10 hover:border-white/30"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Danger zone */}
                                                <div className="mt-auto w-full pt-10">
                                                    {data.isGroup && (
                                                        <button
                                                            type="button"
                                                            onClick={handleLeaveGroup}
                                                            disabled={isMutating}
                                                            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:bg-white/[0.08] active:scale-[0.98] disabled:opacity-50"
                                                        >
                                                            <HiOutlineArrowRightOnRectangle className="size-4" />
                                                            Leave group
                                                        </button>
                                                    )}
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
