'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Laptop, Smartphone, Lock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ALL_USERS_STORAGE_KEY = 'tradeSimulatorAllUsersState';
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

const getCountryFlag = (countryCode: string) => {
  const flags: { [key: string]: string } = {
    US: '🇺🇸',
    RU: '🇷🇺',
    DE: '🇩🇪',
    GB: '🇬🇧',
    XX: '🏳️',
  };
  return flags[countryCode] || '🏳️';
};

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const { toast } = useToast();

  const loadUsers = useCallback(() => {
    try {
      const allUsersStateJSON = localStorage.getItem(ALL_USERS_STORAGE_KEY);
      if (allUsersStateJSON) {
        const allUsersState = JSON.parse(allUsersStateJSON);
        const usersArray = Object.values(allUsersState).map((user: any) => {
            const lastSeen = new Date(user.lastSeenTimestamp);
            const isConsideredOnline = (new Date().getTime() - lastSeen.getTime()) < ONLINE_THRESHOLD_MS;
            const isOnline = user.isRunning && isConsideredOnline;
            
            return {
                id: user.userId,
                isOnline,
                country: 'XX',
                ip: '127.0.0.1',
                device: user.device || 'Unknown',
                robot: user.selectedRobot?.name || 'Not Selected',
                balance: user.balance,
                pnl: user.totalPnl,
                lastSeen: isOnline ? 'Online' : 'Idle',
            };
        });
        setUsers(usersArray.sort((a, b) => (b.isOnline ? 1 : -1) - (a.isOnline ? 1 : -1) || b.balance - a.balance));
      }
    } catch (e) {
      console.error("Failed to load user data", e);
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadUsers]);
  
  const handleRefresh = () => {
    loadUsers();
    toast({
        title: "Данные обновлены",
        description: "Список пользователей был успешно обновлен.",
    });
  }

  const activeUsers = users.filter(u => u.isOnline).length;
  const totalUsers = users.length;
  const totalPnlSum = users.reduce((acc, user) => acc + user.pnl, 0);
  const totalBalanceSum = users.reduce((acc, user) => acc + user.balance, 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P/L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalPnlSum >= 0 ? 'text-success' : 'text-destructive')}>
              {totalPnlSum >= 0 ? '+' : ''}${totalPnlSum.toFixed(2)}
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBalanceSum.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>
                    Live overview of all active trading sessions. Data is for demonstration.
                </CardDescription>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Обновить
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Active Robot</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">P/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        user.isOnline ? "bg-success" : "bg-muted-foreground"
                      )}></span>
                      <span className="text-muted-foreground text-xs">{user.lastSeen}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{user.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <span>{getCountryFlag(user.country)}</span>
                       <span className='font-mono text-xs'>{user.ip}</span>
                    </div>
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-2">
                      {user.device === 'Desktop' ? <Laptop className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
                      {user.device}
                    </div>
                  </TableCell>
                  <TableCell>
                     <Badge variant="secondary">{user.robot}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">${user.balance.toFixed(2)}</TableCell>
                   <TableCell className={cn("text-right font-bold", user.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                     {user.pnl >= 0 ? '+' : ''}${user.pnl.toFixed(2)}
                   </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                        No active users found. Open the main page in a new tab to simulate a new user.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const { toast } = useToast();
    const ADMIN_PASSWORD = 'password';
    const AUTH_KEY = 'admin_authenticated';

    useEffect(() => {
        try {
            const storedAuth = sessionStorage.getItem(AUTH_KEY);
            if (storedAuth === 'true') {
                setIsAuthenticated(true);
            }
        } catch (e) {
            console.error("Could not access session storage", e);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            try {
                sessionStorage.setItem(AUTH_KEY, 'true');
            } catch (e) {
                 console.error("Could not access session storage", e);
            }
            setIsAuthenticated(true);
        } else {
            toast({
                variant: "destructive",
                title: "Неверный пароль",
                description: "Пожалуйста, попробуйте еще раз.",
            });
            setPassword('');
        }
    };

    if (isAuthenticated) {
        return <AdminDashboard />;
    }

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Доступ для администратора
                    </CardTitle>
                    <CardDescription>
                        Пожалуйста, введите пароль для входа в панель администратора.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button type="submit" className="w-full">
                            Войти
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
