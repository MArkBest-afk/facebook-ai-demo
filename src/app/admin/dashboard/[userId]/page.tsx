
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User as UserIcon, Wallet, BarChart2, History, CheckCircle, RefreshCw, Save, Bot, Play, Square, Trash2, UserX, UserCheck, TrendingUp, TrendingDown, MapPin, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { User, Trade } from '@/lib/types';
import { getUserById, updateUserProfile, resetUserSession, addManualTrade, updateUserSubscription } from '@/lib/actions';
import { ROBOTS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';


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

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [name, setName] = useState('');
    const [balanceInput, setBalanceInput] = useState('');
    const userId = params.userId as string;
    const [remainingTime, setRemainingTime] = useState(0);

    const fetchUser = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const userData = await getUserById(userId);
            if (userData) {
                setUser(userData);
                setName(userData.name || '');
                setBalanceInput(userData.balance.toFixed(2));
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

    useEffect(() => {
        if (!user || !user.sessionStartTime) {
            setRemainingTime(user?.timeLimit || 0);
            return;
        }

        const intervalId = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - (user.sessionStartTime || 0)) / 1000);
            const timeLeft = Math.max(0, user.timeLimit - elapsedTime);
            setRemainingTime(timeLeft);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [user]);

    const handleUpdateProfile = async (updates: Partial<User>) => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const success = await updateUserProfile(user._id.toString(), updates);
            if (success) {
                await fetchUser(); // Refetch user data to get the latest state
                toast({ title: 'Success', description: 'User profile updated.' });
            } else {
                // toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
            }
        } catch (error) {
            console.error("Update error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleResetSession = async () => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const success = await resetUserSession(user._id.toString());
            if (success) {
                toast({ title: 'Success', description: 'User session has been reset.' });
                await fetchUser(); // Refetch to show the reset state
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to reset session.' });
            }
        } catch (error) {
            console.error("Reset error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred during reset.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleManualTrade = async (tradeType: 'profitable' | 'losing') => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const success = await addManualTrade(user._id.toString(), tradeType);
            if (success) {
                toast({ title: 'Success', description: `Manual ${tradeType} trade added.` });
                await fetchUser();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to add manual trade.' });
            }
        } catch (error) {
            console.error("Manual trade error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleToggleSubscription = async (isSubscribed: boolean) => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const success = await updateUserSubscription(user._id.toString(), isSubscribed);
            if (success) {
                toast({ title: 'Success', description: 'Subscription status updated.' });
                await fetchUser();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update subscription.' });
            }
        } catch (error) {
            console.error("Subscription update error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveName = () => handleUpdateProfile({ name });
    const handleSaveBalance = () => {
        const newBalance = parseFloat(balanceInput);
        if (!isNaN(newBalance)) {
            handleUpdateProfile({ balance: newBalance });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid balance amount.' });
        }
    };
    const handleRobotSelect = (robotId: string) => handleUpdateProfile({ selectedRobotId: robotId });
    const handleToggleRunning = (isRunning: boolean) => {
        const updates: Partial<User> = { isRunning };
        if (isRunning && !user?.sessionStartTime) {
            updates.sessionStartTime = Date.now();
        }
        handleUpdateProfile(updates);
    }
    const handleToggleBlocked = (isBlocked: boolean) => handleUpdateProfile({ isBlocked });


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

    const isOnline = user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < 60000;
    const timeProgress = user.timeLimit > 0 ? (remainingTime / user.timeLimit) * 100 : 0;
    const timeIsUp = remainingTime <= 0 && !!user.sessionStartTime;

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
                    <div className="flex items-center gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={isUpdating}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will reset the user's session, including their balance, trade history, and robot selection. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleResetSession}>
                                        Reset Session
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="ghost" size="icon" onClick={fetchUser} disabled={isLoading}>
                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        </Button>
                    </div>
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
                                <Input id="userId" value={user._id.toString()} readOnly className="font-mono text-xs" />
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
                             <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Subscribed</Label>
                                    <p className={cn("text-sm", user.isSubscribed ? "text-success" : "text-muted-foreground")}>
                                        {user.isSubscribed ? "User is subscribed" : "Not subscribed"}
                                    </p>
                                </div>
                                <Switch
                                    checked={user.isSubscribed}
                                    onCheckedChange={handleToggleSubscription}
                                    disabled={isUpdating}
                                    aria-readonly
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-6 h-6" />
                                <span>Client Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">IP Address</span>
                                <span className="font-mono">{user.ipAddress || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Location</span>
                                <span className="font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {user.location || 'N/A'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserX className="w-6 h-6" />
                                <span>Access Control</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>User Access</Label>
                                    <p className={cn("text-sm", user.isBlocked ? "text-destructive" : "text-muted-foreground")}>
                                        {user.isBlocked ? "User is blocked" : "User has access"}
                                    </p>
                                </div>
                                <Switch
                                    checked={!!user.isBlocked}
                                    onCheckedChange={handleToggleBlocked}
                                    disabled={isUpdating}
                                    aria-readonly
                                />
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="w-6 h-6" />
                                <span>Robot Control</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <div className="flex justify-between items-center text-sm font-medium mb-2">
                                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Time Remaining</span>
                                    <span className={cn(timeIsUp && "text-destructive font-bold")}>
                                        {timeIsUp ? "Time Expired" : formatTime(remainingTime)}
                                    </span>
                                </div>
                                <Progress value={100 - timeProgress} className="h-2" />
                            </div>
                            <div>
                                <Label htmlFor="robot-select">Selected Robot</Label>
                                <Select
                                    value={user.selectedRobotId || ''}
                                    onValueChange={handleRobotSelect}
                                    disabled={isUpdating || timeIsUp}
                                >
                                    <SelectTrigger id="robot-select">
                                        <SelectValue placeholder="Select a robot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROBOTS.map(robot => (
                                            <SelectItem key={robot.id} value={robot.id}>
                                                {robot.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Trading Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {user.isRunning ? "Robot is currently active." : "Robot is stopped."}
                                    </p>
                                </div>
                                <Switch
                                    checked={user.isRunning}
                                    onCheckedChange={handleToggleRunning}
                                    disabled={isUpdating || !user.selectedRobotId || timeIsUp}
                                    aria-readonly
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <Button variant="outline" onClick={() => handleManualTrade('profitable')} disabled={isUpdating}>
                                    <TrendingUp className="mr-2 h-4 w-4 text-success" />
                                    <span>Profit</span>
                                </Button>
                                <Button variant="outline" onClick={() => handleManualTrade('losing')} disabled={isUpdating}>
                                    <TrendingDown className="mr-2 h-4 w-4 text-destructive" />
                                    <span>Loss</span>
                                </Button>
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
                                <div className="flex gap-2">
                                    <Input type="number" value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)} placeholder="0.00" />
                                    <Button onClick={handleSaveBalance} disabled={isUpdating} size="icon">
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </div>
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
                                                    <TableCell className={cn("text-right font-medium", trade.pnl >= 0 ? 'text-success' : 'text-destructive')}>
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
