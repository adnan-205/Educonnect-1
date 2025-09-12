"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account preferences and profile information.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <Card className="bg-white shadow-sm border-0">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Full Name</Label>
                            <Input
                                id="fullName"
                                type="text"
                                defaultValue="John Doe"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                defaultValue="john.doe@example.com"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                defaultValue="+1 (555) 123-4567"
                                className="w-full"
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                    </CardContent>
                </Card>

                {/* Account Settings */}
                <Card className="bg-white shadow-sm border-0">
                    <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                placeholder="Enter current password"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                className="w-full"
                            />
                        </div>
                        <Button variant="outline" className="w-full">Change Password</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Notification Settings */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive updates about your classes and messages</p>
                            </div>
                            <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Push Notifications</p>
                                <p className="text-sm text-gray-500">Get instant alerts on your device</p>
                            </div>
                            <Button variant="outline" size="sm">Configure</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
