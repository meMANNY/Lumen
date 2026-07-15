import getUsers from "../actions/getUsers";
import Sidebar from "../components/sidebar/Sidebar";
import UserList from "./components/UserList";



export default async function UsersLayout({children}:{children: React.ReactNode}) {

  const users = await getUsers();

  return (
    <Sidebar>
  <div className="flex h-full w-full min-w-0"> 
    <UserList items={users}/>
    {children}
  </div>
  </Sidebar>
  )
}
