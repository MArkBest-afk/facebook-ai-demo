'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Laptop, Smartphone, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration purposes
const users = [
  {
    id: 'user-a1b2',
    isOnline: true,
    country: 'US',
    ip: '73.168.21.14',
    device: 'Desktop',
    robot: 'Balanced Robot',
    balance: 182.54,
    pnl: 32.54,
    lastSeen: 'Online',
  },
  {
    id: 'user-c3d4',
    isOnline: false,
    country: 'RU',
    ip: '91.201.44.87',
    device: 'Mobile',
    robot: 'High Growth Robot',
    balance: 345.10,
    pnl: 195.10,
    lastSeen: '5m ago',
  },
  {
    id: 'user-e5f6',
    isOnline: true,
    country: 'DE',
    ip: '88.198.50.112',
    device: 'Desktop',
    robot: 'Risk Averse Robot',
    balance: 151.02,
    pnl: 1.02,
    lastSeen: 'Online',
  },
    {
    id: 'user-g7h8',
    isOnline: false,
    country: 'GB',
    ip: '109.157.19.22',
    device: 'Mobile',
    robot: 'Balanced Robot',
    balance: 165.78,
    pnl: 15.78,
    lastSeen: '1h ago',
  },
];

const getCountryFlag = (countryCode: string) => {
  // Simple emoji flags based on country code
  const flags: { [key: string]: string } = {
    US: '🇺🇸',
    RU: '🇷🇺',
    DE: '🇩🇪',
    GB: '🇬🇧',
  };
  return flags[countryCode] || '🏳️';
};


const AdminDashboard = () => {
  const activeUsers = users.filter(u => u.isOnline).length;
  const totalUsers = users.length;
  const totalPnl = users.reduce((acc, user) => acc + user.pnl, 0);

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
            <div className={cn("text-2xl font-bold", totalPnl >= 0 ? 'text-success' : 'text-destructive')}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${users.reduce((acc, user) => acc + user.balance, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>
            Live overview of all user trading sessions.
          </CardDescription>
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
              {users.map((user) => (
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
                       <span>{user.ip}</span>
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
              ))}
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