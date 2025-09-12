"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Clock } from "lucide-react"

const earningsData = [
    { month: "Jan", earnings: 1200 },
    { month: "Feb", earnings: 1800 },
    { month: "Mar", earnings: 1500 },
    { month: "Apr", earnings: 2200 },
    { month: "May", earnings: 1900 },
    { month: "Jun", earnings: 2400 }
]

export default function EarningsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
                <p className="text-gray-600 mt-2">Track your income and manage your payouts.</p>
            </div>

            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-3xl font-bold text-blue-600">$2,400</p>
                            <div className="flex items-center justify-center space-x-1 mt-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">+12%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                            <p className="text-3xl font-bold text-green-600">$18,500</p>
                            <p className="text-sm text-gray-500 mt-2">Since joining</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Hours Taught</p>
                            <p className="text-3xl font-bold text-purple-600">156</p>
                            <p className="text-sm text-gray-500 mt-2">This month</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-3xl font-bold text-orange-600">$450</p>
                            <p className="text-sm text-gray-500 mt-2">Next payout</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Earnings Chart */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Earnings Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-2">
                        {earningsData.map((data, i) => (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-blue-600 rounded-t"
                                    style={{ height: `${(data.earnings / 2400) * 200}px` }}
                                />
                                <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                                <span className="text-xs font-medium text-gray-900">${data.earnings}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Class with Student {i + 1}</p>
                                        <p className="text-sm text-gray-500">Mathematics • 60 min</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">${25 + (i * 5)}</p>
                                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
