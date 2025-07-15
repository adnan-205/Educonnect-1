"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LogoutPage() {
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("role")
            setTimeout(() => {
                router.replace("/")
            }, 1000)
        }
    }, [router])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            <h1 className="text-3xl font-bold mb-4">Logging out...</h1>
            <p>You will be redirected to the home page.</p>
        </div>
    )
} 