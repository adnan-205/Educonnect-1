"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  FileText,
  Upload,
  Download,
  Users,
  Clock,
  Share2,
} from "lucide-react"

export default function ClassPage({ params }: { params: { id: string } }) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Sarah Johnson",
      message: "Welcome to our calculus session! Let's start with derivatives.",
      timestamp: "2:00 PM",
      isTeacher: true,
    },
    {
      id: 2,
      sender: "You",
      message: "Thank you! I'm excited to learn.",
      timestamp: "2:01 PM",
      isTeacher: false,
    },
  ])

  const [classInfo] = useState({
    title: "Advanced Calculus - Derivatives",
    teacher: "Sarah Johnson",
    student: "Alex Smith",
    duration: 60,
    startTime: "2:00 PM",
    subject: "Mathematics",
  })

  const [sharedFiles] = useState([
    {
      id: 1,
      name: "Calculus_Notes_Chapter_3.pdf",
      size: "2.4 MB",
      uploadedBy: "Sarah Johnson",
      timestamp: "2:05 PM",
    },
    {
      id: 2,
      name: "Practice_Problems.pdf",
      size: "1.8 MB",
      uploadedBy: "Sarah Johnson",
      timestamp: "2:10 PM",
    },
  ])

  const sendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: "You",
          message: message.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isTeacher: false,
        },
      ])
      setMessage("")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Class Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{classInfo.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Teacher: {classInfo.teacher}</span>
              <span>•</span>
              <span>Student: {classInfo.student}</span>
              <span>•</span>
              <Badge variant="secondary">{classInfo.subject}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Started at {classInfo.startTime}
            </div>
            <Badge variant="outline" className="text-green-600">
              Live
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Call Interface */}
          <Card>
            <CardContent className="p-0">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {/* Teacher Video (Main) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold">{classInfo.teacher}</p>
                    <p className="text-sm opacity-75">Teacher Video</p>
                  </div>
                </div>

                {/* Student Video (Picture-in-Picture) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white/20 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">You</p>
                  </div>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
                    <Button
                      size="sm"
                      variant={isVideoOn ? "secondary" : "destructive"}
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className="rounded-full"
                    >
                      {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isAudioOn ? "secondary" : "destructive"}
                      onClick={() => setIsAudioOn(!isAudioOn)}
                      className="rounded-full"
                    >
                      {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-full">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="rounded-full">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Whiteboard/Screen Share Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Shared Whiteboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">Interactive Whiteboard</p>
                  <p className="text-sm">Teacher can share screen or use whiteboard here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Class Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Messages */}
                  <div className="h-80 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isTeacher ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-xs rounded-lg p-3 ${
                            msg.isTeacher ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">{msg.sender}</span>
                            <span className="text-xs opacity-70">{msg.timestamp}</span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <Button onClick={sendMessage}>Send</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Shared Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Drop files here or click to upload</p>
                    <Button variant="outline" size="sm">
                      Choose Files
                    </Button>
                  </div>

                  {/* File List */}
                  <div className="space-y-3">
                    {sharedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size} • by {file.uploadedBy} • {file.timestamp}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Class Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Class Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-medium">{classInfo.duration} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subject</span>
                <Badge variant="secondary">{classInfo.subject}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Started</span>
                <span className="font-medium">{classInfo.startTime}</span>
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                End Class
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
