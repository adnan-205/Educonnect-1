import { NextResponse } from "next/server";
import { authApi } from "@/services/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email as string | undefined;
    const role = body?.role as string | undefined;

    if (!email || !role || !["student", "teacher", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid email or role" },
        { status: 400 }
      );
    }

    const data = await authApi.updateRole(email, role);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Update role proxy error:", error);
    const message = error?.response?.data?.message || error?.message || "Failed to update role";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
