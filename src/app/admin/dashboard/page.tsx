
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogOut, Home, Users, UserCheck, BarChart2, RefreshCw, Link2, Copy, MessageSquare, Search, Flame, BookOpen, ArrowLeft, ArrowRight, Loader2, PlusCircle, Trash2, UserPlus, Filter, Bot, Square, TrendingUp, Eye, Clock, UserCog } from "lucide-react";
import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { User, Manager } from '@/lib/types';
import { getAllUsers, getAllManagers, createManager, deleteManager } from '@/lib/actions';
import { WithId } from "mongodb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SESSION_TIMEOUT_MS = 60 * 1000; // 1 минута
const USERS_PER_PAGE = 30;

type AuthInfo = {
    role: 'admin' | 'manager';
    username: string;
} | null;

type FilterType = 'all' | 'new' | 'dialogue' | 'trading' | 'timeup' | 'online' | 'subscribed';


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

const isTimeUp = (user: WithId<User>): boolean => {
    if (!user.sessionStartTime) return false;
    const elapsedTime = Math.floor((Date.now() - user.sessionStartTime) / 1000);
    return user.timeLimit - elapsedTime <= 0;
};

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

type LeadStatus = { text: string; variant: 'destructive' | 'success' | 'default' | 'secondary' | 'outline'; icon: React.ElementType };

const getLeadStatuses = (user: WithId<User>): LeadStatus[] => {
    const statuses: LeadStatus[] = [];

    if (user.isHotLead) {
        statuses.push({ text: 'Горячий лид', variant: 'destructive', icon: Flame });
    }
    
    if (isTimeUp(user)) {
        statuses.push({ text: 'Время вышло', variant: 'destructive', icon: Clock });
    } else if (user.isRunning) {
        statuses.push({ text: 'Торгует', variant: 'success', icon: Bot });
    }

    if (user.chatMessages && user.chatMessages.length > 0) {
        statuses.push({ text: 'Диалог', variant: 'default', icon: MessageSquare });
    }
    
    if (statuses.length === 0) {
        if (user.sessionStartTime) {
             statuses.push({ text: 'Просмотр', variant: 'secondary', icon: Eye });
        } else {
             statuses.push({ text: 'Новый', variant: 'outline', icon: UserPlus });
        }
    }

    return statuses;
};


const UserRow = memo(({ user, authInfo }: { user: WithId<User>, authInfo: AuthInfo }) => {
    const router = useRouter();
    const isOnline = user.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < SESSION_TIMEOUT_MS;
    const timeLeftStr = formatRemainingTime(user);
    const chatStatus = getChatStatus(user);
    const leadStatuses = getLeadStatuses(user);

    return (
        <TableRow 
            key={user._id.toString()} 
            onClick={() => router.push(`/admin/dashboard/${user._id.toString()}`)} 
            className="cursor-pointer"
        >
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
            {authInfo?.role === 'admin' && (
                <TableCell>
                    {user.isSubscribed && user.name ? user.name : 'N/A'}
                </TableCell>
            )}
            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {leadStatuses.map((status, index) => (
                        <Badge key={index} variant={status.variant} className={cn('gap-1.5', status.text === 'Горячий лид' && 'animate-pulse')}>
                            <status.icon className="h-3 w-3" />
                            {status.text}
                        </Badge>
                    ))}
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
    );
});
UserRow.displayName = 'UserRow';

function ManagerSection({ managers, onUpdate }: { managers: WithId<Manager>[], onUpdate: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddManagerOpen, setIsAddManagerOpen] = useState(false);
    const [newManagerUsername, setNewManagerUsername] = useState('');
    const [newManagerPassword, setNewManagerPassword] = useState('');

    const handleAddManager = async () => {
        if (!newManagerUsername.trim() || !newManagerPassword.trim()) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Имя пользователя и пароль не могут быть пустыми.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createManager(newManagerUsername, newManagerPassword);
            if (result.success) {
                toast({ title: 'Успех', description: `Менеджер ${newManagerUsername} успешно создан.` });
                onUpdate();
                setIsAddManagerOpen(false);
                setNewManagerUsername('');
                setNewManagerPassword('');
            } else {
                toast({ variant: 'destructive', title: 'Ошибка', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось создать менеджера.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteManager = async (managerId: string, username: string) => {
        setIsSubmitting(true);
        try {
            const success = await deleteManager(managerId);
            if (success) {
                toast({ title: 'Успех', description: `Менеджер ${username} был удален.` });
                onUpdate();
            } else {
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить менеджера.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Произошла непредвиденная ошибка.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Управление менеджерами</h2>
                <Dialog open={isAddManagerOpen} onOpenChange={setIsAddManagerOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Добавить менеджера
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Добавить нового менеджера</DialogTitle>
                            <DialogDescription>
                                Создайте новую учетную запись для менеджера.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                             <div className="space-y-2">
                                <Label htmlFor="manager-username">Имя пользователя (логин)</Label>
                                <Input 
                                    id="manager-username" 
                                    value={newManagerUsername}
                                    onChange={(e) => setNewManagerUsername(e.target.value)}
                                    placeholder="например, manager3" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manager-password">Пароль</Label>
                                <Input 
                                    id="manager-password"
                                    type="password"
                                    value={newManagerPassword}
                                    onChange={(e) => setNewManagerPassword(e.target.value)}
                                    placeholder="••••••••" 
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Отмена
                                </Button>
                            </DialogClose>
                            <Button onClick={handleAddManager} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Добавить'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Имя пользователя</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {managers.length === 0 ? (
                                 <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        Менеджеры не найдены.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                managers.map((manager) => (
                                     <TableRow key={manager._id.toString()}>
                                        <TableCell className="font-mono text-xs">{manager._id.toString()}</TableCell>
                                        <TableCell>{manager.username}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                     <Button variant="destructive" size="icon" disabled={isSubmitting}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Удалить менеджера?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                           Вы уверены, что хотите удалить менеджера "{manager.username}"? Это действие нельзя отменить.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteManager(manager._id.toString(), manager.username)}>
                                                            Удалить
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<WithId<User>[]>([]);
    const [managers, setManagers] = useState<WithId<Manager>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const [authInfo, setAuthInfo] = useState<AuthInfo>(null);
    
    const [leadSignatureBase, setLeadSignatureBase] = useState('');
    const [leadSignatureSuffix, setLeadSignatureSuffix] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    
    const [searchInput, setSearchInput] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    
    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

    const fetchAllData = useCallback(async (isInitialLoad = false, query = submittedSearch) => {
        if (!authInfo) return;

        if (isInitialLoad) setIsLoading(true); else setIsPolling(true);
        
        try {
            const managerId = authInfo.role === 'manager' ? authInfo.username : undefined;
            const { users: userList, total } = await getAllUsers(currentPage, USERS_PER_PAGE, query, managerId);
            setUsers(userList);
            setTotalUsers(total);
            
            if (authInfo.role === 'admin') {
                const managerList = await getAllManagers();
                setManagers(managerList);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            if (isInitialLoad) {
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные.' });
            }
        } finally {
            if (isInitialLoad) setIsLoading(false); else setIsPolling(false);
        }
    }, [toast, currentPage, submittedSearch, authInfo]);


    useEffect(() => {
        try {
            const authData = sessionStorage.getItem('authInfo');
            if (authData) {
                const parsedAuth = JSON.parse(authData);
                setAuthInfo(parsedAuth);
                if (parsedAuth.role === 'manager') {
                    setLeadSignatureBase(parsedAuth.username);
                }
            } else {
                 router.replace('/admin');
            }
        } catch (error) {
            console.error("Failed to parse auth info from sessionStorage", error);
            router.replace('/admin');
        }
    }, [router]);

    useEffect(() => {
        if (authInfo) {
            fetchAllData(true, submittedSearch);
        }
    }, [fetchAllData, submittedSearch, currentPage, authInfo]);


    useEffect(() => {
        const poll = async () => {
             if (submittedSearch || !authInfo) return;
             setIsPolling(true);
             try {
                const managerId = authInfo.role === 'manager' ? authInfo.username : undefined;
                const { users: userList, total } = await getAllUsers(currentPage, USERS_PER_PAGE, '', managerId);
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
    }, [currentPage, submittedSearch, authInfo]);


    const handleLogout = () => {
        try {
            sessionStorage.removeItem('authInfo');
        } catch (error) {
            console.error("Could not remove item from sessionStorage", error);
        }
        router.replace('/admin');
    };

    const handleGoHome = () => {
        router.push('/');
    }
    
    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        setCurrentPage(1);
        setSubmittedSearch(searchInput);
    };

    const handleGenerateLink = () => {
        if (!leadSignatureBase) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Основное имя для лида не может быть пустым.' });
            return;
        }
        const finalSignature = leadSignatureSuffix 
            ? `${leadSignatureBase}-${leadSignatureSuffix}` 
            : leadSignatureBase;

        const baseUrl = window.location.origin;
        const fullLink = `${baseUrl}/?lead_sig=${encodeURIComponent(finalSignature)}`;
        setGeneratedLink(fullLink);
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
    
    const filteredUsers = useMemo(() => {
        switch (activeFilter) {
            case 'new':
                return users.filter(u => !u.sessionStartTime);
            case 'dialogue':
                return users.filter(u => u.chatMessages && u.chatMessages.length > 0);
            case 'trading':
                return users.filter(u => u.isRunning);
            case 'timeup':
                return users.filter(u => isTimeUp(u));
            case 'online':
                return users.filter(u => u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < SESSION_TIMEOUT_MS);
            case 'subscribed':
                return users.filter(u => u.isSubscribed);
            case 'all':
            default:
                return users;
        }
    }, [users, activeFilter]);
    
    const resetLinkGenerator = () => {
        if (authInfo?.role === 'manager') {
            setLeadSignatureBase(authInfo.username);
        } else {
            setLeadSignatureBase('');
        }
        setLeadSignatureSuffix('');
        setGeneratedLink('');
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-headline text-primary">
                        {authInfo?.role === 'manager' ? `Кабинет менеджера: ${authInfo.username}` : 'Панель администратора'}
                    </h1>
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
                                        Создайте уникальную отслеживающую ссылку. Имя менеджера будет добавлено автоматически.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-sig-base">
                                            {authInfo?.role === 'manager' ? 'ID Менеджера (нередактируемый)' : 'Имя/ID лида'}
                                        </Label>
                                        <Input
                                            id="lead-sig-base"
                                            value={leadSignatureBase}
                                            onChange={(e) => {
                                                setLeadSignatureBase(e.target.value);
                                                setGeneratedLink('');
                                            }}
                                            placeholder="например, Ivan_Ivanov"
                                            readOnly={authInfo?.role === 'manager'}
                                            disabled={authInfo?.role === 'manager'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-sig-suffix">Подпись лида</Label>
                                        <Input
                                            id="lead-sig-suffix"
                                            value={leadSignatureSuffix}
                                            onChange={(e) => {
                                                setLeadSignatureSuffix(e.target.value);
                                                setGeneratedLink('');
                                            }}
                                            placeholder="например, ivan_ivanov_googleads"
                                        />
                                    </div>
                                    {generatedLink && (
                                        <div className="space-y-2">
                                            <Label>Сгенерированная ссылка</Label>
                                            <div className="flex items-center gap-2">
                                                <Input value={generatedLink} readOnly />
                                                <Button size="icon" variant="outline" onClick={() => handleCopyLink(generatedLink)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={resetLinkGenerator}>Закрыть</AlertDialogCancel>
                                    <Button onClick={handleGenerateLink} disabled={!leadSignatureBase || !leadSignatureSuffix}>
                                        Создать
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        
                        <Button variant="outline" size="sm" onClick={() => router.push('/admin/docs')}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Документация
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => fetchAllData(false)} disabled={isPolling}>
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
                {authInfo?.role === 'admin' && <ManagerSection managers={managers} onUpdate={() => fetchAllData(false)} />}
                
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Статистика</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Всего лидов</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                                <p className="text-xs text-muted-foreground">{submittedSearch ? 'найдено по запросу' : (authInfo?.role === 'manager' ? 'ваших лидов' : 'всего сессий')}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Подписанные лиды</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{subscribedUsersCount}</div>
                                <p className="text-xs text-muted-foreground">сессии от менеджеров</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Лиды онлайн</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{onlineUsersCount}</div>
                                <p className="text-xs text-muted-foreground">активны в данный момент</p>
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
                                <p className="text-xs text-muted-foreground">по видимым лидам</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">Данные лидов</h2>
                     <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <form onSubmit={handleSearchSubmit} className="flex-grow flex gap-2">
                            <Input
                                placeholder="Поиск по ID или имени..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <Button type="submit" variant="outline" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            <Button variant={activeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('all')}>Все</Button>
                            <Button variant={activeFilter === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('new')}>Новые</Button>
                            <Button variant={activeFilter === 'dialogue' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('dialogue')}>Диалог</Button>
                            <Button variant={activeFilter === 'trading' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('trading')}>Торгует</Button>
                            <Button variant={activeFilter === 'timeup' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('timeup')}>Время вышло</Button>
                            <Button variant={activeFilter === 'online' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('online')}>Онлайн</Button>
                            <Button variant={activeFilter === 'subscribed' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('subscribed')}>Подписанные</Button>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Пользователя</TableHead>
                                        <TableHead>Имя (lead_sig)</TableHead>
                                        {authInfo?.role === 'admin' && (
                                            <TableHead>Менеджер</TableHead>
                                        )}
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Статус онлайн</TableHead>
                                        <TableHead>Чат</TableHead>
                                        <TableHead>Подписан</TableHead>
                                        <TableHead>Последняя активность</TableHead>
                                        <TableHead>Осталось времени</TableHead>
                                        <TableHead className="text-right">Баланс</TableHead>
                                        <TableHead className="text-right">П/У</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={authInfo?.role === 'admin' ? 11 : 10} className="h-24 text-center text-muted-foreground">
                                                Лиды не найдены.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <UserRow key={user._id.toString()} user={user} authInfo={authInfo} />
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
