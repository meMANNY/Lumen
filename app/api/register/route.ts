import bcrypt from "bcrypt";

import prisma from "@/app/libs/prismadb";
import { NextResponse } from "next/server";
import { registerSchema } from "@/app/libs/validations";

export async function POST(request: Request) {

    try {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(parsed.error.flatten(), { status: 400 });
        }

        const { email, name, password } = parsed.data;

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                hashedPassword
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        return NextResponse.json(user);
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return new NextResponse('Email already in use', { status: 409 });
        }
        console.log(error, "REGISTRATION_ERROR")
        return new NextResponse('internal error', {status : 500});
    }

}