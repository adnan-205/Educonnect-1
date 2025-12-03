"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { BookOpen, Menu, X } from "lucide-react"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)



    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            TutorConnected
                        </span>
                    </Link>

                    {/* Always visible theme toggle and profile avatar */}
                    <div className="flex items-center space-x-2">
                        {/* Mobile menu button (only on mobile) */}
                        <div className="md:hidden flex items-center">
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </Button>
                        </div>
                    </div>

                    {/* Desktop Navigation (hidden on mobile) */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
                            Find Teacher
                        </Link>
                        <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                            How it Works
                        </Link>
                        <SignedIn>
                            <Link href="/dashboard">
                                <Button variant="ghost">Dashboard</Button>
                            </Link>
                            <ModeToggle />
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                        <SignedOut>
                            <Button variant="ghost" asChild>
                                <Link href="/sign-in">Log in</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/sign-up">Sign up</Link>
                            </Button>
                        </SignedOut>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t">
                        <div className="flex flex-col space-y-4">
                            <Link href="/browse" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
                                Find Teacher
                            </Link>
                            <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
                                How it Works
                            </Link>
                            <SignedIn>
                                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start">
                                        Dashboard
                                    </Button>
                                </Link>
                                <div className="px-2">
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </SignedIn>
                            <SignedOut>
                                <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setIsOpen(false)}>
                                    <Link href="/sign-in">Log in</Link>
                                </Button>
                                <Button className="w-full justify-start" asChild onClick={() => setIsOpen(false)}>
                                    <Link href="/sign-up">Sign up</Link>
                                </Button>
                            </SignedOut>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
