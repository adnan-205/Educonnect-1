"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function LoginPage() {
    const router = useRouter()

    useEffect(() => {
        // If already logged in, redirect
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null
        if (role === "student") router.replace("/student/dashboard")
        if (role === "teacher") router.replace("/teacher/dashboard")
    }, [router])

    const handleLogin = (role: "student" | "teacher") => {
        if (typeof window !== "undefined") {
            localStorage.setItem("role", role)
            router.replace(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard")
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            <h1 className="text-3xl font-bold mb-4">Login</h1>
            <Button className="w-64" onClick={() => handleLogin("student")}>Login as Student</Button>
            <Button className="w-64" onClick={() => handleLogin("teacher")}>Login as Teacher</Button>
        </div>
    )
} 