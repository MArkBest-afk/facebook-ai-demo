
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';
import { sendChatMessage } from '@/lib/actions';

interface ChatProps {
    userId: string;
    messages: ChatMessage[];
    sender: 'user' | 'admin';
    onNewMessage?: () => void;
    onClose?: () => void;
    title?: string;
}

export function Chat({ userId, messages, sender, onNewMessage, onClose, title = "Chat" }: ChatProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when messages change
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
            await sendChatMessage(userId, sender, newMessage.trim());
            setNewMessage('');
            if (onNewMessage) {
                onNewMessage();
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Optionally show a toast notification here
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="w-full max-w-sm shadow-2xl flex flex-col h-[60vh] bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                <CardTitle className="text-lg">{title}</CardTitle>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                    msg.sender === sender
                                        ? "ml-auto bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                <p>{msg.text}</p>
                                <span className={cn("text-xs opacity-70", msg.sender === sender ? 'text-right' : 'text-left')}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t">
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
