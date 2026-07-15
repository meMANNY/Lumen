import { NextResponse } from "next/server";

import getUsers from "@/app/actions/getUsers";

// Directory of all other users — used by the "add members" picker
export async function GET() {
  const users = await getUsers();
  return NextResponse.json(
    users.map((user) => ({ id: user.id, name: user.name, email: user.email }))
  );
}
