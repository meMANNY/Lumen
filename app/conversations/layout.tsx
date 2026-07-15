import getConversations from "../actions/getConversation";
import getUsers from "../actions/getUsers";
import Sidebar from "../components/sidebar/Sidebar";
import ConversationList from "./components/ConversationList";

export default async function ConversationsLayout({children}: {children: React.ReactNode}){

    const [conversations, users] = await Promise.all([getConversations(), getUsers()]);
  return (
    <Sidebar>
    <div className="flex h-full w-full min-w-0">
        <ConversationList 
        users = {users}
        initialItems = {conversations}/>
      {children}
    </div>
    </Sidebar>
  )
}

