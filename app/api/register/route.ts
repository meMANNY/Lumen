import bcrypt from "bcrypt";

import prisma from "@/app/libs/prismadb";
import { NextResponse } from "next/server";
import { registerSchema } from "@/app/libs/validations";

export async function POST(request: Request) {

    try {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            const requiredFields = ['name', 'email', 'password'] as const;
            const missing = requiredFields.filter(
                (field) => typeof body?.[field] !== 'string' || body[field].trim() === ''
            );

            let message: string;
            if (missing.length === requiredFields.length) {
                message = 'Enter your details';
            } else if (missing.length > 0) {
                const list = missing.join(' and ');
                message = `Enter your details — ${list} ${missing.length === 1 ? 'is' : 'are'} missing`;
            } else {
                message = parsed.error.issues[0]?.message ?? 'Invalid details';
            }

            return NextResponse.json({ message, errors: parsed.error.flatten() }, { status: 400 });
        }

        const { email, name, password } = parsed.data;

        const existingName = await prisma.user.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
            select: { id: true }
        });

        if (existingName) {
            return NextResponse.json(
                { message: 'Username already taken — try another one' },
                { status: 409 }
            );
        }

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