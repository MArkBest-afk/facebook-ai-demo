'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User as UserIcon, Wallet, BarChart2, History, CheckCircle, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { User, Trade } from '@/lib/types';
import { getUserById, updateUserProfile } from '@/lib/actions';

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

export default function UserDetailPage({ params }: { params: { userId: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [name, setName] = useState('');
    const { userId } = params;

    const fetchUser = useCallback(async () => {
        setIsLoading(true);
        try {
            const userData = await getUserById(userId);
            if (userData) {
                setUser(userData);
                setName(userData.name || '');
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
                router.push('/admin/dashboard');
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load user data.' });
        } finally {
            setIsLoading(false);
        }
    }, [userId, router, toast]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleUpdateProfile = async (updates: Partial<User>) => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const success = await updateUserProfile(user._id.toString(), updates);
            if (success) {
                setUser(prev => prev ? { ...prev, ...updates } : null);
                toast({ title: 'Success', description: 'User profile updated.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
            }
        } catch (error) {
            console.error("Update error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveName = () => handleUpdateProfile({ name });
    const handleSubscribeUser = () => handleUpdateProfile({ isSubscribed: true });


    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>User not found.</p>
            </div>
        );
    }

    const isOnline = user.isRunning && (user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < 60000);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-headline text-primary truncate">{user.name || `User ${user._id.toString().slice(-6)}`}</h1>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchUser} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>User Profile</span>
                                <Badge variant={isOnline ? 'default' : 'secondary'} className={cn(isOnline ? 'bg-success/20 text-success-foreground border-success/30' : '')}>
                                    <span className={cn("mr-2 h-2 w-2 rounded-full", isOnline ? 'bg-success' : 'bg-muted-foreground')}></span>
                                    {isOnline ? 'Online' : 'Offline'}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="userId">User ID</Label>
                                <Input id="userId" value={user._id.toString()} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="userName">Name</Label>
                                <div className="flex gap-2">
                                    <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter user name" />
                                    <Button onClick={handleSaveName} disabled={isUpdating} size="icon">
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Subscription</Label>
                                {user.isSubscribed ? (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 text-green-500">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="font-medium">Subscribed</span>
                                    </div>
                                ) : (
                                     <Button onClick={handleSubscribeUser} disabled={isUpdating} className="w-full">
                                        Subscribe User
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${user.balance.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total P/L</CardTitle>
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", user.totalPnl >= 0 ? "text-success" : "text-destructive")}>
                                    {user.totalPnl >= 0 ? '+' : ''}${user.totalPnl.toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                           <div className="flex justify-between"><span>Last Seen:</span> <span className="font-medium text-foreground">{formatTimeAgo(user.lastActive)}</span></div>
                           <div className="flex justify-between"><span>Created:</span> <span className="font-medium text-foreground">{formatTimeAgo(user.createdAt)}</span></div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="w-6 h-6" />
                                <span>Trade History</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-auto max-h-[600px]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-card z-10">
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Symbol</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">P/L</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {user.trades && user.trades.length > 0 ? (
                                            user.trades.map((trade: Trade) => (
                                                <TableRow key={trade.id}>
                                                    <TableCell>{new Date(trade.timestamp).toLocaleString()}</TableCell>
                                                    <TableCell>{trade.symbol}</TableCell>
                                                    <TableCell className={cn(trade.type === 'BUY' ? 'text-success' : 'text-destructive')}>{trade.type}</TableCell>
                                                    <TableCell className={cn("text-right font-medium", trade.pnl >= 0 ? "text-success" : "text-destructive")}>
                                                         {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                    No trades found for this user.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}