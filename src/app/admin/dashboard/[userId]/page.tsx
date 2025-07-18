
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User as UserIcon, Wallet, BarChart2, History, CheckCircle, RefreshCw, Save, Bot, Play, Square, Trash2, UserX, UserCheck, TrendingUp, TrendingDown, MapPin, Globe, Clock, MessageSquare, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { User, Trade, ChatMessage } from '@/lib/types';
import { getUserById, updateUserProfile, deleteUser, addManualTrade, updateUserSubscription } from '@/lib/actions';
import { ROBOTS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Chat } from '@/components/chat';


const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Никогда';
    const now = Date.now();
    const seconds = Math.floor((now - new Date(date).getTime()) / 1000);

    if (seconds < 5) return 'Только что';
    if (seconds < 60) return `${seconds}с назад`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}м назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}ч назад`;
    return `${Math.floor(seconds / 86400)}д назад`;
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
    
    // State for controlled inputs to prevent reset on re-render
    const [name, setName] = useState('');
    const [balanceInput, setBalanceInput] = useState('');
    const [comment, setComment] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    
    const userId = params.userId as string;
    const [remainingTime, setRemainingTime] = useState(0);

    // This function fetches all user data and sets the state.
    // It's called once on load and after major updates.
    const fetchAndSetFullUserData = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const userData = await getUserById(userId);
            if (userData) {
                setUser(userData);
                // Set controlled input state only on full fetch
                setName(userData.name || '');
                setBalanceInput(userData.balance.toFixed(2));
                setComment(userData.comment || '');
                setChatMessages(userData.chatMessages || []);
            } else {
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Пользователь не найден.' });
                router.push('/admin/dashboard');
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные пользователя.' });
        } finally {
            setIsLoading(false);
        }
    }, [userId, router, toast]);

    // This function fetches only the data that changes frequently
    // to avoid resetting the whole page and losing input focus.
    const fetchDynamicUserData = useCallback(async () => {
        if (!userId) return;
        try {
            const userData = await getUserById(userId);
            if (userData) {
                // Update only the non-input parts of the user state
                setUser(currentUser => {
                    if (!currentUser) return userData;
                    return {
                        ...currentUser,
                        lastActive: userData.lastActive,
                        isRunning: userData.isRunning,
                        isBlocked: userData.isBlocked,
                        isSubscribed: userData.isSubscribed,
                        selectedRobotId: userData.selectedRobotId,
                        trades: userData.trades,
                        totalPnl: userData.totalPnl,
                        sessionStartTime: userData.sessionStartTime,
                        timeLimit: userData.timeLimit,
                        balance: userData.balance, // Also update balance in case of manual trades
                        isAiChatEnabled: userData.isAiChatEnabled,
                    };
                });
                setChatMessages(userData.chatMessages || []);
            }
        } catch (error) {
            console.error("Failed to fetch dynamic user data:", error);
        }
    }, [userId]);
    
    // Initial data load
    useEffect(() => {
        fetchAndSetFullUserData();
    }, [fetchAndSetFullUserData]);

    // Polling for dynamic data
    useEffect(() => {
        const interval = setInterval(fetchDynamicUserData, 5000); // Poll for updates every 5 seconds
        return () => clearInterval(interval);
    }, [fetchDynamicUserData]);

    useEffect(() => {
        if (!user) return;
    
        if (!user.sessionStartTime) {
            setRemainingTime(user.timeLimit || 0);
            return;
        }

        const intervalId = setInterval(() => {
            const now = Date.now();
            const sessionStart = user.sessionStartTime || now;
            const elapsedTime = Math.floor((now - sessionStart) / 1000);
            const timeLeft = Math.max(0, user.timeLimit - elapsedTime);
            setRemainingTime(timeLeft);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [user?.sessionStartTime, user?.timeLimit]);
    
    const handleUpdateProfile = async (updates: Partial<User>) => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const success = await updateUserProfile(user._id.toString(), updates);
            if (success) {
                // After an update, refetch everything to ensure consistency
                await fetchAndSetFullUserData();
                toast({ title: 'Успех', description: 'Профиль пользователя обновлен.' });
            } else {
                // toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
            }
        } catch (error) {
            console.error("Update error:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Произошла непредвиденная ошибка.' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleDeleteUser = async () => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const success = await deleteUser(user._id.toString());
            if (success) {
                toast({ title: 'Успех', description: 'Пользователь был удален.' });
                router.push('/admin/dashboard');
            } else {
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить пользователя.' });
                 setIsUpdating(false);
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Произошла непредвиденная ошибка во время удаления.' });
            setIsUpdating(false);
        }
    };

    const handleManualTrade = async (tradeType: 'profitable' | 'losing') => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const success = await addManualTrade(user._id.toString(), tradeType);
            if (success) {
                toast({ title: 'Успех', description: `Ручная ${tradeType === 'profitable' ? 'прибыльная' : 'убыточная'} сделка добавлена.` });
                await fetchAndSetFullUserData();
            } else {
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить ручную сделку.' });
            }
        } catch (error) {
            console.error("Manual trade error:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Произошла непредвиденная ошибка.' });
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
                toast({ title: 'Успех', description: 'Статус подписки обновлен.' });
                await fetchAndSetFullUserData();
            } else {
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить подписку.' });
            }
        } catch (error) {
            console.error("Subscription update error:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Произошла непредвиденная ошибка.' });
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
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Неверная сумма баланса.' });
        }
    };
    const handleSaveComment = () => handleUpdateProfile({ comment });
    const handleRobotSelect = (robotId: string) => handleUpdateProfile({ selectedRobotId: robotId });
    const handleToggleRunning = (isRunning: boolean) => {
        const updates: Partial<User> = { isRunning };
        if (isRunning && !user?.sessionStartTime) {
            updates.sessionStartTime = Date.now();
        }
        handleUpdateProfile(updates);
    }
    const handleToggleBlocked = (isBlocked: boolean) => handleUpdateProfile({ isBlocked });
    const handleToggleAiChat = (isEnabled: boolean) => handleUpdateProfile({ isAiChatEnabled: isEnabled });


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
                <p>Пользователь не найден.</p>
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
                        <h1 className="text-xl font-headline text-primary truncate">{user.name || `Пользователь ${user._id.toString().slice(-6)}`}</h1>
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
                                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие навсегда удалит пользователя и все связанные с ним данные из базы. Это действие нельзя отменить.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteUser}>
                                        Удалить пользователя
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="ghost" size="icon" onClick={fetchDynamicUserData} disabled={isUpdating}>
                            <RefreshCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Профиль пользователя</span>
                                <Badge variant={isOnline ? 'default' : 'secondary'} className={cn(isOnline ? 'bg-success/20 text-success-foreground border-success/30' : '')}>
                                    <span className={cn("mr-2 h-2 w-2 rounded-full", isOnline ? 'bg-success' : 'bg-muted-foreground')}></span>
                                    {isOnline ? 'Онлайн' : 'Оффлайн'}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="userId">ID пользователя</Label>
                                <Input id="userId" value={user._id.toString()} readOnly className="font-mono text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="userName">Имя</Label>
                                <div className="flex gap-2">
                                    <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите имя пользователя" />
                                    <Button onClick={handleSaveName} disabled={isUpdating} size="icon">
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Подписан</Label>
                                    <p className={cn("text-sm", user.isSubscribed ? "text-success" : "text-muted-foreground")}>
                                        {user.isSubscribed ? "Пользователь подписан" : "Не подписан"}
                                    </p>
                                </div>
                                <Switch
                                    checked={!!user.isSubscribed}
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
                                <span>Информация о клиенте</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">IP Адрес</span>
                                <span className="font-mono">{user.ipAddress || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Местоположение</span>
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
                                <span>Управление доступом</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Доступ пользователя</Label>
                                    <p className={cn("text-sm", user.isBlocked ? "text-destructive" : "text-muted-foreground")}>
                                        {user.isBlocked ? "Пользователь заблокирован" : "Пользователь имеет доступ"}
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
                                <span>Управление роботом</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <div className="flex justify-between items-center text-sm font-medium mb-2">
                                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Оставшееся время</span>
                                    <span className={cn(timeIsUp && "text-destructive font-bold")}>
                                        {timeIsUp ? "Время вышло" : formatTime(remainingTime)}
                                    </span>
                                </div>
                                <Progress value={100 - timeProgress} className="h-2" />
                            </div>
                            <div>
                                <Label htmlFor="robot-select">Выбранный робот</Label>
                                <Select
                                    value={user.selectedRobotId || ''}
                                    onValueChange={handleRobotSelect}
                                    disabled={isUpdating || timeIsUp}
                                >
                                    <SelectTrigger id="robot-select">
                                        <SelectValue placeholder="Выберите робота" />
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
                                    <Label>Статус торговли</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {user.isRunning ? "Робот активен." : "Робот остановлен."}
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
                                    <span>Прибыль</span>
                                </Button>
                                <Button variant="outline" onClick={() => handleManualTrade('losing')} disabled={isUpdating}>
                                    <TrendingDown className="mr-2 h-4 w-4 text-destructive" />
                                    <span>Убыток</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Баланс</CardTitle>
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
                                <CardTitle className="text-sm font-medium">Общий П/У</CardTitle>
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
                            <CardTitle className="text-sm font-medium">Активность</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                           <div className="flex justify-between"><span>Последняя активность:</span> <span className="font-medium text-foreground">{formatTimeAgo(user.lastActive)}</span></div>
                           <div className="flex justify-between"><span>Создан:</span> <span className="font-medium text-foreground">{formatTimeAgo(user.createdAt)}</span></div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-6 h-6" />
                                    <span>Чат с клиентом</span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                                <div className="space-y-0.5">
                                    <Label className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />AI Ассистент</Label>
                                    <p className={cn("text-sm", user.isAiChatEnabled ? "text-success" : "text-muted-foreground")}>
                                        {user.isAiChatEnabled ? "AI помогает в чате" : "AI отключен"}
                                    </p>
                                </div>
                                <Switch
                                    checked={!!user.isAiChatEnabled}
                                    onCheckedChange={handleToggleAiChat}
                                    disabled={isUpdating}
                                    aria-readonly
                                />
                            </div>
                             <Chat 
                                userId={user._id.toString()} 
                                messages={chatMessages}
                                sender="admin"
                                onNewMessage={fetchDynamicUserData}
                                isAdmin
                            />
                        </CardContent>
                    </Card>
                    <Card className="flex-grow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="w-6 h-6" />
                                <span>История торгов</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-auto max-h-[600px]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-card z-10">
                                        <TableRow>
                                            <TableHead>Время</TableHead>
                                            <TableHead>Символ</TableHead>
                                            <TableHead>Тип</TableHead>
                                            <TableHead className="text-right">П/У</TableHead>
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
                                                    Сделки для этого пользователя не найдены.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-6 h-6" />
                                <span>Комментарий</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)} 
                                placeholder="Оставьте комментарий о клиенте..." 
                                rows={4}
                            />
                            <Button onClick={handleSaveComment} disabled={isUpdating}>
                                <Save className="mr-2 h-4 w-4" />
                                Сохранить комментарий
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
