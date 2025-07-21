
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogOut, Home, Users, UserCheck, BarChart2, RefreshCw, Link2, Copy, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { User } from '@/lib/types';
import { getAllUsers } from '@/lib/actions';
import { WithId } from "mongodb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SESSION_TIMEOUT_MS = 60 * 1000; // 1 минута

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

const formatRemainingTime = (user: WithId<User>): string => {
    if (!user.sessionStartTime) {
        const h = Math.floor(user.timeLimit / 3600);
        const m = Math.floor((user.timeLimit % 3600) / 60);
        return `Не начато (${h}ч ${m}м)`;
    }
    const elapsedTime = Math.floor((Date.now() - user.sessionStartTime) / 1000);
    const timeLeft = user.timeLimit - elapsedTime;

    if (timeLeft <= 0) {
        return 'Время вышло';
    }

    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    return `Осталось ${h}ч ${m}м`;
};

const getChatStatus = (user: WithId<User>): { text: string; variant: 'default' | 'destructive' | 'outline' } => {
    const hasMessages = user.chatMessages && user.chatMessages.length > 0;
    if (!hasMessages) {
        return { text: 'Нет чата', variant: 'outline' };
    }
    
    const lastMessage = user.chatMessages[user.chatMessages.length - 1];
    if (lastMessage.sender === 'user') {
        return { text: 'Ответ клиента', variant: 'default' };
    }

    if (lastMessage.sender === 'admin' && lastMessage.senderName === 'Поддержка') {
        return { text: 'AI отвечает', variant: 'destructive' };
    }

    return { text: 'Вы ответили', variant: 'outline' };
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<WithId<User>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const [leadSignature, setLeadSignature] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');

    const fetchUsers = async (isInitialLoad = false) => {
        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsPolling(true);
        }
        try {
            const userList = await getAllUsers();
            setUsers(userList);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить список пользователей.' });
        } finally {
            if (isInitialLoad) {
                setIsLoading(false);
            } else {
                setIsPolling(false);
            }
        }
    };

    useEffect(() => {
        fetchUsers(true); // Initial load with full-screen loader
        const interval = setInterval(() => fetchUsers(false), 5000); // Subsequent polling without full loader
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
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, введите имя для лида.' });
            return;
        }
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/?lead_sig=${encodeURIComponent(leadSignature)}`;
        setGeneratedLink(link);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            toast({ title: 'Успех', description: 'Ссылка скопирована в буфер обмена!' });
        }, () => {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось скопировать ссылку.' });
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
                    <h1 className="text-xl font-headline text-primary">Панель администратора</h1>
                    <div className="flex items-center gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Создать ссылку
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Создание ссылки для лида</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Введите уникальное имя или ID для лида. Будет сгенерирована специальная ссылка для отслеживания.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-sig">Имя/ID лида</Label>
                                        <Input
                                            id="lead-sig"
                                            value={leadSignature}
                                            onChange={(e) => {
                                                setLeadSignature(e.target.value);
                                                setGeneratedLink('');
                                            }}
                                            placeholder="например, Ivan_Ivanov_123"
                                        />
                                    </div>
                                    {generatedLink && (
                                        <div className="space-y-2">
                                            <Label>Сгенерированная ссылка</Label>
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
                                    <AlertDialogCancel onClick={() => { setLeadSignature(''); setGeneratedLink(''); }}>Закрыть</AlertDialogCancel>
                                    <Button onClick={handleGenerateLink}>Создать</Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="ghost" size="icon" onClick={() => fetchUsers(false)} disabled={isPolling}>
                            <RefreshCw className={cn("h-4 w-4", isPolling && "animate-spin")} />
                        </Button>
                         <Button variant="outline" size="sm" onClick={handleGoHome}>
                            <Home className="mr-2 h-4 w-4" />
                            Главная
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Выйти
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                 {isLoading ? (
                    <div className="flex h-[60vh] items-center justify-center">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    </div>
                ) : (
                <>
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Статистика пользователей</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                                <p className="text-xs text-muted-foreground">все зарегистрированные сессии</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Пользователи онлайн</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{onlineUsers}</div>
                                <p className="text-xs text-muted-foreground">активны в данный момент</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Подписанные лиды</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{subscribedUsers}</div>
                                <p className="text-xs text-muted-foreground">из сгенерированных ссылок</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Общий П/У</CardTitle>
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", totalPnl >= 0 ? "text-success" : "text-destructive")}>
                                    {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">по всем пользователям</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">Данные пользователей</h2>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Пользователя</TableHead>
                                        <TableHead>Имя</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Чат</TableHead>
                                        <TableHead>Подписан</TableHead>
                                        <TableHead>Последняя активность</TableHead>
                                        <TableHead>Осталось времени</TableHead>
                                        <TableHead className="text-right">Баланс</TableHead>
                                        <TableHead className="text-right">П/У</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                Пользователи не найдены.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => {
                                            const isOnline = user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < SESSION_TIMEOUT_MS;
                                            const timeLeftStr = formatRemainingTime(user);
                                            const chatStatus = getChatStatus(user);
                                            return (
                                                <TableRow key={user._id.toString()} onClick={() => router.push(`/admin/dashboard/${user._id.toString()}`)} className="cursor-pointer">
                                                    <TableCell className="font-mono text-xs">{user._id.toString()}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {user.hasUnreadAdminMessages && (
                                                                <span className="relative flex h-3 w-3">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                                                </span>
                                                            )}
                                                            <span>{user.name || 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={isOnline ? 'default' : 'secondary'} className={cn(isOnline ? 'bg-success/20 text-success-foreground border-success/30' : '')}>
                                                            <span className={cn("mr-2 h-2 w-2 rounded-full", isOnline ? 'bg-success' : 'bg-muted-foreground')}></span>
                                                            {isOnline ? 'Онлайн' : 'Оффлайн'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={chatStatus.variant} className={cn(
                                                             chatStatus.variant === 'default' && 'bg-blue-500/20 text-blue-700 border-blue-500/30',
                                                             chatStatus.variant === 'destructive' && 'bg-amber-500/20 text-amber-700 border-amber-500/30'
                                                        )}>
                                                           {chatStatus.text}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                         <Badge variant={user.isSubscribed ? 'success' : 'outline'}>
                                                            {user.isSubscribed ? 'Да' : 'Нет'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{formatTimeAgo(user.lastActive)}</TableCell>
                                                    <TableCell className={cn("text-muted-foreground", timeLeftStr === 'Время вышло' && 'text-destructive font-semibold')}>
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
                </>
                )}
            </main>
        </div>
    )
}
