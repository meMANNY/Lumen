
import { useMemo } from "react";

import {HiChat} from "react-icons/hi"
import {HiArchiveBox,
HiArrowLeftOnRectangle,
HiUsers} from "react-icons/hi2";

import { signOut } from "next-auth/react";

import useConversation from "./useConversation";
import { usePathname, useSearchParams } from "next/navigation";

const useRoutes = ()=>{
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { conversationId } = useConversation();

    const isArchivedView = searchParams.get('view') === 'archived';

    const routes = useMemo(()=>[{
        label: "Chat",
        href: '/conversations',
        icon: HiChat,
        active: (pathname == "/conversations" && !isArchivedView) || !!conversationId
    },
    {
        label: 'Users',
        href: '/users',
        icon: HiUsers,
        active: pathname === '/users'
    },
    {
        label: 'Archived',
        href: '/conversations?view=archived',
        icon: HiArchiveBox,
        active: pathname === '/conversations' && isArchivedView
    },
    {
        label: 'Sign Out',
        onClick: () => signOut({ callbackUrl: '/' }),
        href: '#',
        icon: HiArrowLeftOnRectangle,
    }],[pathname,conversationId,isArchivedView]);

    return routes;

}
export default useRoutes;
