import { NextApiRequest, NextApiResponse } from "next"
import { auth } from "@/auth"

import { pusherServer } from "@/app/libs/pusher"

export default async function handler(
  request: NextApiRequest, 
  response: NextApiResponse
) {
  // For Pages API routes in NextAuth v5, we need to use getSession differently
  // We'll use a workaround by making this a route handler check
  const session = await auth()

  if (!session?.user?.email) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const socketId = request.body.socket_id;
  const channel = request.body.channel_name;
  const data = {
    user_id: session.user.email,
  };

  const authResponse = pusherServer.authorizeChannel(socketId, channel, data);
  return response.send(authResponse);
}