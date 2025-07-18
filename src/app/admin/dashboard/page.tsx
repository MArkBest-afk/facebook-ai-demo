
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogOut, Home, Users, UserCheck, BarChart2, RefreshCw, Link2, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { User } from '@/lib/types';
import { getAllUsers } from '@/lib/actions';
import { WithId } from "mongodb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SESSION_TIMEOUT_MS = 60 * 1000; // 1 minute

const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = Date.now();
    const seconds = Math.floor((now - new Date(date).getTime()) / 1000);

    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

const formatRemainingTime = (user: WithId<User>): string => {
    if (!user.sessionStartTime) {
        return 'Not Started';
    }
    const elapsedTime = Math.floor((Date.now() - user.sessionStartTime) / 1000);
    const timeLeft = user.timeLimit - elapsedTime;

    if (timeLeft <= 0) {
        return 'Expired';
    }

    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    return `${h}h ${m}m left`;
};

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<WithId<User>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [leadSignature, setLeadSignature] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');


    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const userList = await getAllUsers();
            setUsers(userList);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 15000); // Poll every 15 seconds
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

    const handleGenerateLink = () => {
        if (!leadSignature) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a name for the lead.' });
            return;
        }
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/?lead_sig=${encodeURIComponent(leadSignature)}`;
        setGeneratedLink(link);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            toast({ title: 'Success', description: 'Link copied to clipboard!' });
        }, () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to copy link.' });
        });
    };

    const onlineUsers = users.filter(u => u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < SESSION_TIMEOUT_MS).length;
    const totalUsers = users.length;
    const totalPnl = users.reduce((acc, user) => acc + (user.totalPnl || 0), 0);
    const subscribedUsers = users.filter(u => u.isSubscribed).length;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-headline text-primary">Admin Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Generate Link
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Generate Lead Link</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Enter a unique name or ID for the lead. A special link will be generated to track them.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-sig">Lead Name/ID</Label>
                                        <Input
                                            id="lead-sig"
                                            value={leadSignature}
                                            onChange={(e) => {
                                                setLeadSignature(e.target.value);
                                                setGeneratedLink('');
                                            }}
                                            placeholder="e.g., John_Doe_123"
                                        />
                                    </div>
                                    {generatedLink && (
                                        <div className="space-y-2">
                                            <Label>Generated Link</Label>
                                            <div className="flex items-center gap-2">
                                                <Input value={generatedLink} readOnly />
                                                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => { setLeadSignature(''); setGeneratedLink(''); }}>Close</AlertDialogCancel>
                                    <Button onClick={handleGenerateLink}>Generate</Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="ghost" size="icon" onClick={fetchUsers} disabled={isLoading}>
                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        </Button>
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                                <CardTitle className="text-sm font-medium">Subscribed Leads</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{subscribedUsers}</div>
                                <p className="text-xs text-muted-foreground">from generated links</p>
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
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Subscribed</TableHead>
                                        <TableHead>Last Seen</TableHead>
                                        <TableHead>Time Left</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-right">P/L</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                Loading user data...
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => {
                                            const isOnline = user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < SESSION_TIMEOUT_MS;
                                            const timeLeftStr = formatRemainingTime(user);
                                            return (
                                                <TableRow key={user._id.toString()} onClick={() => router.push(`/admin/dashboard/${user._id.toString()}`)} className="cursor-pointer">
                                                    <TableCell className="font-mono text-xs">{user._id.toString()}</TableCell>
                                                    <TableCell>{user.name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={isOnline ? 'default' : 'secondary'} className={cn(isOnline ? 'bg-success/20 text-success-foreground border-success/30' : '')}>
                                                            <span className={cn("mr-2 h-2 w-2 rounded-full", isOnline ? 'bg-success' : 'bg-muted-foreground')}></span>
                                                            {isOnline ? 'Online' : 'Offline'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                         <Badge variant={user.isSubscribed ? 'success' : 'outline'}>
                                                            {user.isSubscribed ? 'Yes' : 'No'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{formatTimeAgo(user.lastActive)}</TableCell>
                                                    <TableCell className={cn("text-muted-foreground", timeLeftStr === 'Expired' && 'text-destructive font-semibold')}>
                                                        {timeLeftStr}
                                                    </TableCell>
                                                    <TableCell className="text-right">${user.balance.toFixed(2)}</TableCell>
                                                    <TableCell className={cn("text-right font-medium", user.totalPnl >= 0 ? "text-success" : "text-destructive")}>
                                                        {user.totalPnl >= 0 ? '+' : ''}${user.totalPnl.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
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
