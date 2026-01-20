import { NextApiRequest, NextApiResponse } from "next"
import { getToken } from "next-auth/jwt"

import { pusherServer } from "@/app/libs/pusher"

export default async function handler(
  request: NextApiRequest, 
  response: NextApiResponse
) {
  // Use getToken for Pages API routes - more compatible with next-auth v5
  // Cast request to work around type mismatch between Pages Router and next-auth v5
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET 
  })

  if (!token?.email) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const socketId = request.body.socket_id;
  const channel = request.body.channel_name;
  const data = {
    user_id: token.email,
  };

  const authResponse = pusherServer.authorizeChannel(socketId, channel, data);
  return response.send(authResponse);
}