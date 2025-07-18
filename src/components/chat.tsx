
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';
import { sendChatMessage, deleteChatMessage, clearChatHistory } from '@/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';

interface ChatProps {
    userId: string;
    messages: ChatMessage[];
    sender: 'user' | 'admin';
    onNewMessage?: () => void;
    onClose?: () => void;
    title?: string;
    isAdmin?: boolean;
}

export function Chat({ userId, messages, sender, onNewMessage, onClose, title = "Chat", isAdmin = false }: ChatProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [adminName, setAdminName] = useState('Поддержка');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                 setTimeout(() => viewport.scrollTop = viewport.scrollHeight, 100);
            }
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;
        setIsSending(true);
        try {
            await sendChatMessage(userId, sender, newMessage.trim(), sender === 'admin' ? adminName : undefined);
            setNewMessage('');
            onNewMessage?.();
        } catch (error) {
            console.error('Failed to send message:', error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отправить сообщение.' });
        } finally {
            setIsSending(false);
        }
    };
    
    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteChatMessage(userId, messageId);
            onNewMessage?.();
        } catch (error) {
            console.error('Failed to delete message:', error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить сообщение.' });
        }
    };

    const handleClearHistory = async () => {
        try {
            await clearChatHistory(userId);
            onNewMessage?.();
        } catch (error) {
            console.error('Failed to clear chat history:', error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось очистить историю чата.' });
        }
    };


    return (
        <Card className="w-full h-full shadow-2xl flex flex-col bg-card sm:rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                <CardTitle className="text-lg">{title}</CardTitle>
                <div className="flex items-center gap-1">
                    {isAdmin && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Очистить историю чата?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие навсегда удалит все сообщения в этом чате. Это действие нельзя отменить.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearHistory}>Очистить</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="p-4 space-y-4">
                        {messages.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                                <MessageSquare className="w-10 h-10 mb-4" />
                                <h3 className="font-semibold text-lg">Чат со службой поддержки</h3>
                                <p className="text-sm">Задавайте свои вопросы в любое время. Мы здесь, чтобы помочь!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={cn("flex flex-col items-start gap-2 group", msg.sender === sender ? "items-end" : "items-start")}>
                                     {msg.sender !== sender && msg.senderName && (
                                        <div className="text-xs font-medium text-muted-foreground ml-2">{msg.senderName}</div>
                                    )}
                                    <div className={cn("flex items-end gap-2 w-full", msg.sender === sender ? "justify-end" : "justify-start")}>
                                        {isAdmin && msg.sender !== sender && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteMessage(msg.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <div
                                            className={cn(
                                                "flex max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                                                msg.sender === sender
                                                    ? "ml-auto bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            <p className="break-all">{msg.text}</p>
                                            <span className={cn("text-xs opacity-70", msg.sender === sender ? 'text-right' : 'text-left')}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {isAdmin && msg.sender === sender && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteMessage(msg.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t flex flex-col gap-2">
                {isAdmin && (
                    <div className="w-full space-y-1.5">
                        <Label htmlFor="admin-name">Ваше имя в чате</Label>
                        <Input 
                            id="admin-name"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            placeholder="Поддержка"
                        />
                    </div>
                )}
                <div className="flex w-full items-center space-x-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Введите сообщение..."
                        disabled={isSending}
                    />
                    <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
