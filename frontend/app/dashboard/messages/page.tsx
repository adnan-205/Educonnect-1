"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Send, Search } from "lucide-react"

const mockConversations = [
    {
        id: 1,
        name: "Emma Wilson",
        lastMessage: "Thank you for the great calculus lesson!",
        time: "2 min ago",
        unread: 2,
        avatar: "/placeholder.jpg"
    },
    {
        id: 2,
        name: "Michael Brown",
        lastMessage: "Can we reschedule tomorrow's class?",
        time: "1 hour ago",
        unread: 0,
        avatar: "/placeholder.jpg"
    },
    {
        id: 3,
        name: "Sarah Johnson",
        lastMessage: "I have a question about the homework",
        time: "3 hours ago",
        unread: 1,
        avatar: "/placeholder.jpg"
    }
]

export default function MessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState(mockConversations[0])
    const [newMessage, setNewMessage] = useState("")

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            // In a real app, this would send the message
            console.log("Sending message:", newMessage)
            setNewMessage("")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-600 mt-2">Communicate with your students and teachers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Conversations List */}
                <Card className="bg-white shadow-sm border-0">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Conversations</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search conversations..."
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-1">
                            {mockConversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                                        selectedConversation.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={conversation.avatar} />
                                            <AvatarFallback>
                                                {conversation.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {conversation.name}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {conversation.time}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-600 truncate">
                                                    {conversation.lastMessage}
                                                </p>
                                                {conversation.unread > 0 && (
                                                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                                        {conversation.unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="bg-white shadow-sm border-0 lg:col-span-2">
                    <CardHeader className="pb-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={selectedConversation.avatar} />
                                <AvatarFallback>
                                    {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{selectedConversation.name}</CardTitle>
                                <p className="text-sm text-gray-500">Online</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col h-full">
                        {/* Messages Area */}
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                            {/* Sample messages */}
                            <div className="flex justify-start">
                                <div className="max-w-xs lg:max-w-md px-4 py-2 bg-gray-100 rounded-lg">
                                    <p className="text-sm">Hi! I have a question about today's lesson.</p>
                                    <span className="text-xs text-gray-500">10:30 AM</span>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className="max-w-xs lg:max-w-md px-4 py-2 bg-blue-600 text-white rounded-lg">
                                    <p className="text-sm">Sure! What would you like to know?</p>
                                    <span className="text-xs text-blue-100">10:32 AM</span>
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="max-w-xs lg:max-w-md px-4 py-2 bg-gray-100 rounded-lg">
                                    <p className="text-sm">{selectedConversation.lastMessage}</p>
                                    <span className="text-xs text-gray-500">10:35 AM</span>
                                </div>
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-100">
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1"
                                />
                                <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
