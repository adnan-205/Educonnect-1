import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, password, role } = body

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || "Registration failed" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
