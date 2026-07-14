import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { messageSchema, objectId } from "@/app/libs/validations";
import { conversationChannel, userChannel } from "@/app/libs/channels";
import { MESSAGES_PAGE_SIZE } from "@/app/actions/getMessages";

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get("conversationId");
        const cursor = searchParams.get("cursor");

        if (!conversationId || !objectId.safeParse(conversationId).success) {
            return new NextResponse("Invalid conversationId", { status: 400 });
        }

        if (cursor && !objectId.safeParse(cursor).success) {
            return new NextResponse("Invalid cursor", { status: 400 });
        }

        const conversation = await getConversationForUser(conversationId, currentUser.id);

        if (!conversation) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const items = await prisma.message.findMany({
            where: { conversationId },
            include: { sender: true, seen: true },
            orderBy: { createdAt: 'desc' },
            take: MESSAGES_PAGE_SIZE + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        });

        const hasMore = items.length > MESSAGES_PAGE_SIZE;
        const page = hasMore ? items.slice(0, MESSAGES_PAGE_SIZE) : items;
        const messages = page.reverse();

        return NextResponse.json({
            messages,
            nextCursor: hasMore ? messages[0].id : null,
        });
    } catch (error: any) {
        console.log(error, "ERROR_MESSAGES_GET");
        return new NextResponse("Internal Error", { status: 500 });
    }
}


export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse("unauthorised", { status: 401 });
        }

        const body = await request.json();
        const parsed = messageSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(parsed.error.flatten(), { status: 400 });
        }

        const { message, image, conversationId } = parsed.data;

        const conversation = await getConversationForUser(conversationId, currentUser.id);

        if (!conversation) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Create message with sender already marked as seen
        const newMessage = await prisma.message.create({
            data: {
                body: message,
                image: image,
                conversationId: conversationId,
                senderId: currentUser.id,
                seenIds: [currentUser.id]
            },
            include: {
                sender: true,
                seen: true
            }
        });

        await prisma.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                lastMessageAt: new Date(),
                messagesIds: {
                    push: newMessage.id
                }
            }
        })
        await pusherServer.trigger(conversationChannel(conversationId), 'messages:new', newMessage);

        conversation.users.forEach((user) => {
            pusherServer.trigger(userChannel(user.id), 'conversation:update', {
                id: conversationId,
                messages: [newMessage]
            })
        });

        return NextResponse.json(newMessage);

    } catch (error: any) {
        console.log(error, "ERROR_MESSAGES");
        return new NextResponse("Internal Error", { status: 500 });

    }
}
