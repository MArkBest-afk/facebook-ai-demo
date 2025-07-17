'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogOut, Home, Users, UserCheck, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { INITIAL_BALANCE } from "@/lib/constants";

type UserSession = {
    accountId: string;
    status: 'Online' | 'Offline';
    lastSeen: string;
    initialBalance: number;
    currentBalance: number;
    pnl: number;
    isRunning: boolean;
};

const STATE_STORAGE_KEY_PREFIX = 'tradeSimulatorState_';
const SESSION_TIMEOUT_MS = 60 * 1000; // 1 minute

const formatTimeAgo = (timestamp: number | null): string => {
    if (timestamp === null) return 'Never';
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserSession[]>([]);

    useEffect(() => {
        const fetchUserSessions = () => {
            if (typeof window === 'undefined') return;
            
            const sessions: UserSession[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STATE_STORAGE_KEY_PREFIX)) {
                    try {
                        const savedState = JSON.parse(localStorage.getItem(key)!);
                        const isTimedOut = (Date.now() - (savedState.lastActive || 0)) > SESSION_TIMEOUT_MS;
                        
                        sessions.push({
                            accountId: savedState.accountId,
                            status: savedState.isRunning && !isTimedOut ? 'Online' : 'Offline',
                            lastSeen: formatTimeAgo(savedState.lastActive),
                            initialBalance: INITIAL_BALANCE,
                            currentBalance: savedState.balance,
                            pnl: savedState.totalPnl,
                            isRunning: savedState.isRunning,
                        });
                    } catch (e) {
                        console.error(`Failed to parse session data for key ${key}:`, e);
                    }
                }
            }
            setUsers(sessions);
        };

        fetchUserSessions();
        const interval = setInterval(fetchUserSessions, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        try {
            sessionStorage.removeItem('isAdminAuthenticated');
        } catch (error) {
            console.error("Could not remove item from sessionStorage", error);
        }
        router.replace('/admin');
    };

    const handleGoHome = () => {
        router.push('/');
    }

    const onlineUsers = users.filter(u => u.status === 'Online').length;
    const totalUsers = users.length;
    const totalPnl = users.reduce((acc, user) => acc + user.pnl, 0);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-headline text-primary">Admin Dashboard</h1>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={handleGoHome}>
                            <Home className="mr-2 h-4 w-4" />
                            Main App
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4">User Statistics</h2>
                    <p className="text-muted-foreground mb-4">Displaying live sessions from this browser. No central backend is used.</p>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                                <p className="text-xs text-muted-foreground">all registered sessions</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Online Users</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{onlineUsers}</div>
                                <p className="text-xs text-muted-foreground">currently active</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total P/L</CardTitle>
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", totalPnl >= 0 ? "text-success" : "text-destructive")}>
                                    {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">across all users</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">User Details</h2>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Seen</TableHead>
                                        <TableHead className="text-right">Current Balance</TableHead>
                                        <TableHead className="text-right">P/L</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No active user sessions found in this browser. Open the main app in another tab to see data here.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.accountId}>
                                                <TableCell className="font-mono">{user.accountId}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.status === 'Online' ? 'default' : 'secondary'} className={cn(user.status === 'Online' ? 'bg-success/20 text-success-foreground border-success/30' : '')}>
                                                        <span className={cn("mr-2 h-2 w-2 rounded-full", user.status === 'Online' ? 'bg-success' : 'bg-muted-foreground')}></span>
                                                        {user.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{user.lastSeen}</TableCell>
                                                <TableCell className="text-right">${user.currentBalance.toFixed(2)}</TableCell>
                                                <TableCell className={cn("text-right font-medium", user.pnl >= 0 ? "text-success" : "text-destructive")}>
                                                    {user.pnl >= 0 ? '+' : ''}${user.pnl.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
