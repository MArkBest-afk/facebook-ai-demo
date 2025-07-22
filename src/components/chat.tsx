
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, Trash2, MessageSquare, CreditCard, Copy, Link as LinkIcon, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ObjectId } from '@/lib/types';
import { deleteChatMessage, clearChatHistory } from '@/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';


interface ChatProps {
    userId: string;
    messages: ChatMessage[];
    sender: 'user' | 'admin';
    onNewMessage?: (sentMessage: Partial<ChatMessage>) => void;
    onClose?: () => void;
    title?: string;
    isAdmin?: boolean;
}

export function Chat({ userId, messages, sender, onNewMessage, onClose, title = "Chat", isAdmin = false }: ChatProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [adminName, setAdminName] = useState('Поддержка');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // State for payment dialog
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState('');
    const [paymentLink, setPaymentLink] = useState('');
    const [paymentLinkText, setPaymentLinkText] = useState('Оплатить');

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        const messagesContainer = messagesContainerRef.current;
        if (!scrollArea || !messagesContainer) return;

        const viewport = scrollArea.querySelector('div[data-radix-scroll-area-viewport]');
        if (!viewport) return;

        const scrollToBottom = () => {
            viewport.scrollTop = viewport.scrollHeight;
        };

        // Scroll to bottom initially
        scrollToBottom();

        // Use MutationObserver to scroll to bottom when new messages are added
        const observer = new MutationObserver(scrollToBottom);
        observer.observe(messagesContainer, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
        };
    }, [messages]);


    const handleSendMessage = async () => {
        const text = newMessage.trim();
        if (!text) return;
        
        setIsSending(true);

        const messageData: Partial<ChatMessage> = {
            sender,
            senderName: sender === 'admin' ? adminName : undefined,
            text,
        };
        
        if (onNewMessage) {
            onNewMessage(messageData);
        }

        setNewMessage('');
        setIsSending(false);
    };

    const handleSendSpecialMessage = (messageData: Partial<ChatMessage>) => {
         if (!onNewMessage) return;

         const finalMessage: Partial<ChatMessage> = {
            sender,
            senderName: sender === 'admin' ? adminName : undefined,
            ...messageData,
        };

        onNewMessage(finalMessage);

        // Reset payment dialog fields if they were used
        if(messageData.paymentInfo) setPaymentDetails('');
        if(messageData.paymentLink) {
            setPaymentLink('');
            setPaymentLinkText('Оплатить');
        }
        setIsPaymentDialogOpen(false);
    }
    
    const handleDeleteMessage = async (messageId: string | ObjectId) => {
        try {
            await deleteChatMessage(userId, messageId.toString());
            onNewMessage?.({}); // Trigger a refresh
        } catch (error) {
            console.error('Failed to delete message:', error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить сообщение.' });
        }
    };

    const handleClearHistory = async () => {
        try {
            await clearChatHistory(userId);
            onNewMessage?.({}); // Trigger a refresh
        } catch (error) {
            console.error('Failed to clear chat history:', error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось очистить историю чата.' });
        }
    };

    const handleSendPaymentDetails = () => {
        if (!paymentDetails.trim()) return;
        handleSendSpecialMessage({
            text: 'Пожалуйста, используйте следующие реквизиты для пополнения счета.',
            paymentInfo: { details: paymentDetails.trim() }
        });
    };

    const handleSendPaymentLink = () => {
        if (!paymentLink.trim() || !paymentLinkText.trim()) return;
         try {
            // Validate URL
            new URL(paymentLink);
        } catch (_) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, введите действительный URL.' });
            return;
        }
        handleSendSpecialMessage({
            text: 'Пожалуйста, используйте кнопку ниже для перехода к оплате.',
            paymentLink: { url: paymentLink.trim(), buttonText: paymentLinkText.trim() }
        });
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: 'Успех', description: 'Реквизиты скопированы в буфер обмена.' });
        }, () => {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось скопировать реквизиты.' });
        });
    };

    const renderMessageContent = (msg: ChatMessage) => {
        if (msg.paymentInfo) {
            return (
                 <div className="space-y-2">
                    <p>{msg.text}</p>
                    <div className="bg-background/50 rounded-md p-3 border border-border/50">
                        <pre className="text-xs whitespace-pre-wrap font-mono">{msg.paymentInfo.details}</pre>
                    </div>
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => handleCopyToClipboard(msg.paymentInfo!.details)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Копировать реквизиты
                    </Button>
                </div>
            );
        }
        if (msg.paymentLink) {
            return (
                <div className="space-y-3">
                    <p>{msg.text}</p>
                    <a href={msg.paymentLink.url} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            {msg.paymentLink.buttonText}
                        </Button>
                    </a>
                </div>
            )
        }
        return msg.text && <p className="break-words">{msg.text}</p>;
    }


    return (
        <Card className={cn(
            "shadow-2xl flex flex-col bg-card",
            isAdmin 
                ? "h-[70vh] w-full"
                : "w-full h-full sm:h-[80vh] max-w-lg sm:rounded-lg"
        )}>
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
                    <div className="p-4 space-y-4" ref={messagesContainerRef}>
                        {messages.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                                <MessageSquare className="w-10 h-10 mb-4" />
                                <h3 className="font-semibold text-lg">Чат со службой поддержки</h3>
                                <p className="text-sm">Задавайте свои вопросы в любое время. Мы здесь, чтобы помочь!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div key={msg.id?.toString() || `temp-${index}`} className={cn("flex flex-col items-start gap-2 group", msg.sender === sender ? "items-end" : "items-start")}>
                                     {msg.sender !== sender && msg.senderName && (
                                        <div className="text-xs font-medium text-muted-foreground ml-2 flex items-center gap-1">
                                            {msg.senderName === 'Поддержка' && <Bot className="w-3 h-3"/>}
                                            {msg.senderName}
                                        </div>
                                    )}
                                    <div className={cn("flex items-end gap-2", msg.sender === sender ? "flex-row-reverse" : "flex-row")}>
                                        {isAdmin && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteMessage(msg.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <div
                                            className={cn(
                                                "flex max-w-[85%] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                                                msg.sender === sender
                                                    ? "ml-auto bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            {renderMessageContent(msg)}
                                            <span className={cn("text-xs opacity-70", msg.sender === sender ? 'text-right' : 'text-left')}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
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
                        onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                        placeholder="Введите сообщение..."
                        disabled={isSending}
                    />
                     {isAdmin && (
                        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                            <DialogTrigger asChild>
                                 <Button variant="outline" size="icon" disabled={isSending}>
                                    <CreditCard className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Создать платеж</DialogTitle>
                                    <DialogDescription>
                                        Отправьте клиенту реквизиты для оплаты или платежную ссылку.
                                    </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="details">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="details">Реквизиты</TabsTrigger>
                                        <TabsTrigger value="link">Ссылка</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="details" className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="payment-details">Реквизиты для оплаты</Label>
                                            <Textarea 
                                                id="payment-details" 
                                                placeholder="Введите реквизиты (номер карты, счета и т.д.)" 
                                                rows={5}
                                                value={paymentDetails}
                                                onChange={(e) => setPaymentDetails(e.target.value)}
                                            />
                                        </div>
                                        <Button onClick={handleSendPaymentDetails} disabled={isSending || !paymentDetails.trim()} className="w-full">
                                            Отправить реквизиты
                                        </Button>
                                    </TabsContent>
                                    <TabsContent value="link" className="space-y-4 pt-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="payment-link-url">URL платежной ссылки</Label>
                                            <Input 
                                                id="payment-link-url" 
                                                placeholder="https://stripe.com/..." 
                                                value={paymentLink}
                                                onChange={(e) => setPaymentLink(e.target.value)}
                                            />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="payment-link-text">Текст на кнопке</Label>
                                            <Input 
                                                id="payment-link-text" 
                                                placeholder="Оплатить"
                                                value={paymentLinkText}
                                                onChange={(e) => setPaymentLinkText(e.target.value)}
                                            />
                                        </div>
                                        <Button onClick={handleSendPaymentLink} disabled={isSending || !paymentLink.trim() || !paymentLinkText.trim()} className="w-full">
                                            Отправить ссылку
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                    )}
                    <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
