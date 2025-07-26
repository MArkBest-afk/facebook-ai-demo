
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogOut, Home, Users, UserCheck, BarChart2, RefreshCw, Link2, Copy, MessageSquare, Search, FireExtinguisher, Flame, BookOpen, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { User } from '@/lib/types';
import { getAllUsers } from '@/lib/actions';
import { WithId } from "mongodb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SESSION_TIMEOUT_MS = 60 * 1000; // 1 минута
const USERS_PER_PAGE = 30;

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
    
    if (user.hasUnreadAdminMessages) {
         return { text: 'Ответ клиента', variant: 'default' };
    }
    
    const lastMessage = user.chatMessages[user.chatMessages.length - 1];
    if (lastMessage.sender === 'admin' && lastMessage.senderName === 'Поддержка') {
        return { text: 'AI отвечает', variant: 'destructive' };
    }

    return { text: 'Вы ответили', variant: 'outline' };
}

const UserRow = memo(({ user }: { user: WithId<User> }) => {
    const router = useRouter();
    const isOnline = user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < SESSION_TIMEOUT_MS;
    const timeLeftStr = formatRemainingTime(user);
    const chatStatus = getChatStatus(user);

    return (
        <TableRow 
            key={user._id.toString()} 
            onClick={() => router.push(`/admin/dashboard/${user._id.toString()}`)} 
            className={cn(
                "cursor-pointer",
                user.isHotLead && "bg-amber-500/10 hover:bg-amber-500/20"
            )}
        >
            <TableCell className="font-mono text-xs">{user._id.toString()}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    {user.hasUnreadAdminMessages && !user.isHotLead && (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    )}
                    <span>{user.name || 'N/A'}</span>
                </div>
            </TableCell>
            <TableCell>
                 <Badge variant={user.isHotLead ? 'destructive' : 'outline'} className={cn(user.isHotLead && 'animate-pulse')}>
                    {user.isHotLead ? (
                        <>
                            <Flame className="mr-2 h-4 w-4" /> Горячий лид
                        </>
                    ) : (
                        'Обычный'
                    )}
                </Badge>
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
    );
});
UserRow.displayName = 'UserRow';

function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<WithId<User>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    
    // State for link generation dialog
    const [leadSignature, setLeadSignature] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [shortenedLink, setShortenedLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

    const fetchUsers = useCallback(async (isInitialLoad = false, query = debouncedSearchQuery) => {
        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsPolling(true);
        }
        try {
            const { users: userList, total } = await getAllUsers(currentPage, USERS_PER_PAGE, query);
            
            setUsers(userList);
            setTotalUsers(total);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            if (isInitialLoad) {
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить список пользователей.' });
            }
        } finally {
            if (isInitialLoad) {
                setIsLoading(false);
            } else {
                setIsPolling(false);
            }
        }
    }, [toast, currentPage, debouncedSearchQuery]);

    useEffect(() => {
        fetchUsers(true, debouncedSearchQuery);
    }, [fetchUsers, debouncedSearchQuery, currentPage]);

    // Reset page to 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery]);

    // Regular polling for stats and background updates
    useEffect(() => {
        const poll = async () => {
             if (searchQuery) return; // Don't poll when searching
             setIsPolling(true);
             try {
                const { users: userList, total } = await getAllUsers(currentPage, USERS_PER_PAGE);
                setUsers(userList);
                setTotalUsers(total);
             } catch (e) {
                console.error("Polling failed", e);
             } finally {
                setIsPolling(false);
             }
        };
        const interval = setInterval(poll, 5000);
        return () => clearInterval(interval);
    }, [currentPage, searchQuery]);


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

    const handleGenerateLink = async () => {
        if (!leadSignature) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, введите имя для лида.' });
            return;
        }
        setIsGenerating(true);
        const baseUrl = window.location.origin;
        const fullLink = `${baseUrl}/?lead_sig=${encodeURIComponent(leadSignature)}`;
        setGeneratedLink(fullLink);

        try {
            const response = await fetch(`https://spoo.me/create.php?url=${encodeURIComponent(fullLink)}`);
            if (response.ok) {
                const shortUrl = await response.text();
                setShortenedLink(shortUrl);
            } else {
                throw new Error('Failed to shorten URL');
            }
        } catch (error) {
            console.error("URL shortening error:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось создать короткую ссылку.' });
            setShortenedLink('');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = (link: string) => {
        navigator.clipboard.writeText(link).then(() => {
            toast({ title: 'Успех', description: 'Ссылка скопирована в буфер обмена!' });
        }, () => {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось скопировать ссылку.' });
        });
    };
    
    const onlineUsersCount = useMemo(() => users.filter(u => u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < SESSION_TIMEOUT_MS).length, [users]);
    const totalPnlSum = useMemo(() => users.reduce((acc, user) => acc + (user.totalPnl || 0), 0), [users]);
    const subscribedUsersCount = useMemo(() => users.filter(u => u.isSubscribed).length, [users]);
    
    const resetLinkGenerator = () => {
        setLeadSignature('');
        setGeneratedLink('');
        setShortenedLink('');
        setIsGenerating(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-headline text-primary">Панель администратора</h1>
                    <div className="flex items-center gap-2">
                        <AlertDialog onOpenChange={(isOpen) => !isOpen && resetLinkGenerator()}>
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
                                        Введите уникальное имя или ID для лида. Будет сгенерирована специальная и короткая ссылка для отслеживания.
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
                                                setShortenedLink('');
                                            }}
                                            placeholder="например, Ivan_Ivanov_123"
                                        />
                                    </div>
                                    {generatedLink && (
                                        <div className="space-y-2">
                                            <Label>Полная ссылка</Label>
                                            <div className="flex items-center gap-2">
                                                <Input value={generatedLink} readOnly />
                                                <Button size="icon" variant="outline" onClick={() => handleCopyLink(generatedLink)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                     {shortenedLink && (
                                        <div className="space-y-2">
                                            <Label>Короткая ссылка</Label>
                                            <div className="flex items-center gap-2">
                                                <Input value={shortenedLink} readOnly />
                                                <Button size="icon" variant="outline" onClick={() => handleCopyLink(shortenedLink)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={resetLinkGenerator}>Закрыть</AlertDialogCancel>
                                    <Button onClick={handleGenerateLink} disabled={isGenerating}>
                                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Создать
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        
                        <Button variant="outline" size="sm" onClick={() => router.push('/admin/docs')}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Документация
                        </Button>

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
                                <p className="text-xs text-muted-foreground">{searchQuery ? 'найдено по запросу' : 'всего сессий'}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Пользователи онлайн</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{onlineUsersCount}</div>
                                <p className="text-xs text-muted-foreground">активны в данный момент</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Подписанные лиды</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{subscribedUsersCount}</div>
                                <p className="text-xs text-muted-foreground">из сгенерированных ссылок</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Общий П/У</CardTitle>
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", totalPnlSum >= 0 ? "text-success" : "text-destructive")}>
                                    {totalPnlSum >= 0 ? '+' : ''}${totalPnlSum.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">по всем пользователям</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">Данные пользователей</h2>
                     <div className="mb-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Поиск по ID или имени..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Пользователя</TableHead>
                                        <TableHead>Имя</TableHead>
                                        <TableHead>Статус лида</TableHead>
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
                                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                                Пользователи не найдены.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <UserRow key={user._id.toString()} user={user} />
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Назад
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Страница {currentPage} из {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Вперёд
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
                </>
                )}
            </main>
        </div>
    )
}
