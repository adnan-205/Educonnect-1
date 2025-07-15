"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function SignupPage() {
    const router = useRouter()

    useEffect(() => {
        // If already signed up/logged in, redirect
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null
        if (role === "student") router.replace("/student/dashboard")
        if (role === "teacher") router.replace("/teacher/dashboard")
    }, [router])

    const handleSignup = (role: "student" | "teacher") => {
        if (typeof window !== "undefined") {
            localStorage.setItem("role", role)
            router.replace(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard")
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            <h1 className="text-3xl font-bold mb-4">Sign Up</h1>
            <Button className="w-64" onClick={() => handleSignup("student")}>Sign up as Student</Button>
            <Button className="w-64" onClick={() => handleSignup("teacher")}>Sign up as Teacher</Button>
        </div>
    )
} 