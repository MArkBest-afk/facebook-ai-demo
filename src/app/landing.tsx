
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, BrainCircuit, CandlestickChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import './landing.css';

export default function LandingPage() {
    const router = useRouter();

    const handleGetStarted = () => {
        router.push('/trade');
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Image src="/logo.svg" alt="logo" width={40} height={40} className="text-primary" />
                    <h1 className="text-2xl font-headline text-primary">Facebook AI</h1>
                </div>
                <Button onClick={handleGetStarted}>
                    Начать торговлю <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </header>

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative text-center py-20 md:py-32 bg-card/50 overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 z-0"></div>
                     <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-0"></div>
                    <div className="container mx-auto px-6 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-bold font-headline mb-4 animate-fade-in-up">
                            Будущее трейдинга с <span className="text-primary">искусственным интеллектом</span>
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                           Наши AI-роботы анализируют рынки 24/7, чтобы вы могли зарабатывать, даже когда спите. Начните с демо-счета на $150 и убедитесь сами.
                        </p>
                        <Button onClick={handleGetStarted} size="lg" className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            Начать бесплатно <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </section>
                
                {/* Features Section */}
                <section className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold font-headline">Как это работает?</h3>
                            <p className="text-md text-muted-foreground mt-2">Три простых шага к вашей первой сделке</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center p-8 bg-card rounded-lg shadow-md hover:shadow-primary/20 transition-shadow duration-300">
                                <div className="mb-4 bg-primary/10 rounded-full p-4 w-fit mx-auto">
                                    <BrainCircuit className="w-10 h-10 text-primary" />
                                </div>
                                <h4 className="text-xl font-semibold mb-2">1. Выберите робота</h4>
                                <p className="text-muted-foreground">
                                    Выберите одного из трех AI-роботов в зависимости от вашей склонности к риску: Осторожный, Сбалансированный или Высокодоходный.
                                </p>
                            </div>
                            <div className="text-center p-8 bg-card rounded-lg shadow-md hover:shadow-primary/20 transition-shadow duration-300">
                                <div className="mb-4 bg-primary/10 rounded-full p-4 w-fit mx-auto">
                                    <Bot className="w-10 h-10 text-primary" />
                                </div>
                                <h4 className="text-xl font-semibold mb-2">2. Активируйте AI</h4>
                                <p className="text-muted-foreground">
                                    Запустите торговлю одним нажатием. Наш AI начнет анализировать рыночные данные в реальном времени и совершать сделки за вас.
                                </p>
                            </div>
                             <div className="text-center p-8 bg-card rounded-lg shadow-md hover:shadow-primary/20 transition-shadow duration-300">
                                 <div className="mb-4 bg-primary/10 rounded-full p-4 w-fit mx-auto">
                                    <CandlestickChart className="w-10 h-10 text-primary" />
                                </div>
                                <h4 className="text-xl font-semibold mb-2">3. Наблюдайте за ростом</h4>
                                <p className="text-muted-foreground">
                                    Следите за результатами в истории торгов. Вся прибыль, полученная на демо-счете, могла бы быть вашей на реальном счете.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                 {/* Image Gallery Section */}
                <section className="py-16 md:py-24 bg-card/50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold font-headline">Платформа, созданная для успеха</h3>
                             <p className="text-md text-muted-foreground mt-2">Интуитивно понятный интерфейс и мощные инструменты под капотом.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <Image
                                    src="https://placehold.co/1200x600.png"
                                    alt="Main dashboard view"
                                    width={1200}
                                    height={600}
                                    className="rounded-lg shadow-xl"
                                    data-ai-hint="dashboard trading"
                                />
                            </div>
                            <Image
                                src="https://placehold.co/600x400.png"
                                alt="Robot selection screen"
                                width={600}
                                height={400}
                                className="rounded-lg shadow-xl"
                                data-ai-hint="robot selection"
                            />
                            <Image
                                src="https://placehold.co/600x400.png"
                                alt="Trade history log"
                                width={600}
                                height={400}
                                className="rounded-lg shadow-xl"
                                data-ai-hint="trading history"
                            />
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 md:py-32">
                    <div className="container mx-auto px-6 text-center">
                        <h3 className="text-3xl md:text-4xl font-bold font-headline mb-4">Готовы увидеть AI в действии?</h3>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                           Хватит упускать возможности. Пока вы смотрите, другие уже зарабатывают. Начните свой путь в трейдинге сегодня.
                        </p>
                        <Button onClick={handleGetStarted} size="lg">
                           Получить демо-счет
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="bg-card border-t">
                <div className="container mx-auto px-6 py-4 text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Facebook AI. Все права защищены.</p>
                </div>
            </footer>
        </div>
    );
}
