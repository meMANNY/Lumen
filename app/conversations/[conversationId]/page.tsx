import getConversationById from "@/app/actions/getConversationsById";
import getMessages from "@/app/actions/getMessages";
import EmptyState from "@/app/components/EmptyState";
import Header from "./components/Header";
import Body from "./components/Body";
import Form from "./components/Form";
import SharedSpace from "./components/SharedSpace";


interface IParams {
    conversationId: string;
}

const ConversationId = async ({ params }: { params: Promise<IParams> }) => {
    const { conversationId } = await params;

    const conversation = await getConversationById(conversationId);
    const { messages, nextCursor } = await getMessages(conversationId);

    if (!conversation) {
        return (
            <div className="h-full w-full flex-1 flex flex-col">
                <EmptyState />
            </div>
        )
    }

    return (
        <div className="flex h-full w-full flex-1 min-w-0">
            <div className="flex h-full min-w-0 flex-1 flex-col">
                <Header conversation={conversation} />
                <Body initialMessages={messages} initialCursor={nextCursor} />
                <Form />
            </div>
            <SharedSpace conversation={conversation} messages={messages} />
        </div>
    )
}

export default ConversationId;