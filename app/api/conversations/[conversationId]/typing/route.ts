import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/getCurrentUser";
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { conversationChannel } from "@/app/libs/channels";

interface IParams {
  conversationId?: string;
}

// Fire-and-forget typing signal; clients throttle and expire it themselves.
export async function POST(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { conversationId } = await params;

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const conversation = await getConversationForUser(conversationId, currentUser.id);

    if (!conversation) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await pusherServer.trigger(conversationChannel(conversationId), 'typing', {
      userId: currentUser.id,
      name: currentUser.name || 'Someone',
    });

    return new NextResponse('OK');
  } catch (error) {
    console.log(error, 'ERROR_TYPING');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
