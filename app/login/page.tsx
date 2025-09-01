"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function LoginPage() {
    const router = useRouter()

    useEffect(() => {
        // If already logged in, redirect
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null
        if (role) router.replace("/dashboard")
    }, [router])

    const handleLogin = (role: "student" | "teacher" | "admin") => {
        if (typeof window !== "undefined") {
            localStorage.setItem("role", role)
            router.replace("/dashboard")
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">Login</h1>
            <div className="w-full max-w-sm space-y-3">
                <Button className="w-full" onClick={() => handleLogin("student")}>Login as Student</Button>
                <Button className="w-full" onClick={() => handleLogin("teacher")}>Login as Teacher</Button>
                <Button className="w-full" onClick={() => handleLogin("admin")}>Login as Admin</Button>
            </div>
        </div>
    )
} 