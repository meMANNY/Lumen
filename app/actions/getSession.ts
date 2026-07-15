import { auth } from "@/auth"

export default async function getSession() {
    return await auth();
}