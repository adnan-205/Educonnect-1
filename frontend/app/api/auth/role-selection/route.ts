import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { authApi } from "@/services/api"

export async function GET(request: Request) {
    try {
        const token = await getToken({ req: request as any })
        if (!token) {
            return NextResponse.redirect("/sign-in")
        }

        const searchParams = new URL(request.url).searchParams
        const role = searchParams.get("role")

        if (!role || !["student", "teacher"].includes(role)) {
            return NextResponse.redirect("/sign-up?error=invalid-role")
        }

        // Update the user's role in your backend
        await authApi.updateRole(token.email as string, role)

        // Redirect to unified dashboard
        return NextResponse.redirect("/dashboard-2")
    } catch (error) {
        console.error("Role selection error:", error)
        return NextResponse.redirect("/sign-up?error=role-update-failed")
    }
}
