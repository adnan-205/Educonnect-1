import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { authApi } from "@/services/api"
import * as Sentry from "@sentry/nextjs"

const ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  DASHBOARD: "/dashboard",
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token?.email) {
      return NextResponse.redirect(ROUTES.SIGN_IN)
    }

    const role = request.nextUrl.searchParams.get("role")
    if (!role || !["student", "teacher"].includes(role)) {
      return NextResponse.redirect(`${ROUTES.SIGN_UP}?error=invalid-role`)
    }

    const response = await authApi.updateRole(token.email, role)
    if (!response.ok) {
      return NextResponse.redirect(`${ROUTES.SIGN_UP}?error=backend-failure`)
    }

    return NextResponse.redirect(ROUTES.DASHBOARD)
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.redirect(`${ROUTES.SIGN_UP}?error=role-update-failed`)
  }
}
