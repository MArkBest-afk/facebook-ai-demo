
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Bot, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getManager } from '@/lib/actions';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await getManager(username, password);

      if (result.success && result.manager) {
        try {
            const authInfo = {
                role: result.manager.role,
                username: result.manager.username,
            };
            sessionStorage.setItem('authInfo', JSON.stringify(authInfo));
            router.push('/admin/dashboard');
        } catch (error) {
            console.error("Could not set sessionStorage", error);
            toast({
              variant: 'destructive',
              title: 'Ошибка входа',
              description: 'Не удалось сохранить сессию. Пожалуйста, включите cookies/хранилище.',
            });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка входа',
          description: result.message || 'Неверное имя пользователя или пароль.',
        });
      }
    } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ошибка сервера',
          description: 'Произошла ошибка при попытке входа. Пожалуйста, попробуйте снова.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <Bot className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl font-headline">Панель управления</CardTitle>
          <CardDescription>Пожалуйста, войдите для продолжения</CardDescription>
        </CardHeader>
        <CardContent>
           <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Важное уведомление</AlertTitle>
            <AlertDescription>
              Если не нравиться - иди нахуй и закрывай лида орально. Критикуешь - сделай лучше и используй.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[2.1rem] text-muted-foreground"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Войти'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    