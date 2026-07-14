import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { NextResponse } from "next/server";
import { settingsSchema } from "@/app/libs/validations";

export async function POST(request: Request){
    try {
        const currentUser =  await getCurrentUser();

        if(!currentUser?.id){
            return new NextResponse("Unauthorized", {status: 401});
        }

        const body = await request.json();
        const parsed = settingsSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(parsed.error.flatten(), { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: currentUser.id
            },
            data: parsed.data,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error: any) {
        console.log(error, 'ERROR_SETTINGS');
        return new NextResponse('Internal Error' , {status: 500});
    }
}