
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, BrainCircuit, CheckCircle, ShieldCheck, TrendingUp, Zap, Shield, GitCompareArrows, BarChart, Users, DollarSign, CreditCard, LifeBuoy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import './landing.css';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LandingPage() {
    const router = useRouter();

    const handleGetStarted = () => {
        router.push('/trade');
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                     <div className="flex items-center gap-3">
                        <Image src="/logo.svg" alt="logo" width={40} height={40} className="text-primary" />
                        <h1 className="text-2xl font-bold text-primary">Facebook AI от Meta</h1>
                    </div>
                    <Button onClick={handleGetStarted}>
                        Начать торговлю <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </header>

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative text-center py-20 md:py-32 bg-card/50 overflow-hidden">
                     <div className="absolute inset-0 bg-grid-pattern opacity-10 z-0"></div>
                     <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-0"></div>
                    <div className="container mx-auto px-6 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in-up">
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
                            <h3 className="text-3xl md:text-4xl font-bold">Почему выбирают нас?</h3>
                            <p className="text-md text-muted-foreground mt-2">Мощные инструменты и передовые технологии для вашего успеха.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <Card className="text-center p-6 shadow-md hover:shadow-primary/20 transition-shadow duration-300">
                                <CardHeader className="p-0">
                                    <div className="mb-4 bg-primary/10 rounded-full p-4 w-fit mx-auto">
                                        <Zap className="w-10 h-10 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl font-semibold mb-2">Автоматизированная Торговля</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 text-muted-foreground">
                                    Наши AI-роботы работают круглосуточно, анализируя тысячи сигналов, чтобы вы не упустили ни одной возможности.
                                </CardContent>
                            </Card>
                             <Card className="text-center p-6 shadow-md hover:shadow-primary/20 transition-shadow duration-300">
                                <CardHeader className="p-0">
                                    <div className="mb-4 bg-primary/10 rounded-full p-4 w-fit mx-auto">
                                        <TrendingUp className="w-10 h-10 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl font-semibold mb-2">Стратегии под вас</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 text-muted-foreground">
                                    Выберите один из трех AI-роботов в зависимости от вашей склонности к риску: от осторожного до высокодоходного.
                                </CardContent>
                            </Card>
                             <Card className="text-center p-6 shadow-md hover:shadow-primary/20 transition-shadow duration-300">
                                 <CardHeader className="p-0">
                                    <div className="mb-4 bg-primary/10 rounded-full p-4 w-fit mx-auto">
                                        <ShieldCheck className="w-10 h-10 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl font-semibold mb-2">Безопасный старт</CardTitle>
                                 </CardHeader>
                                <CardContent className="p-0 text-muted-foreground">
                                    Проверьте эффективность наших алгоритмов на демо-счете с виртуальными $150, прежде чем вкладывать реальные деньги.
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                 {/* How it works Section */}
                <section className="py-16 md:py-24 bg-card/50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold">Как это работает?</h3>
                            <p className="text-md text-muted-foreground mt-2">Три простых шага к вашей первой автоматической сделке.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full text-2xl font-bold mb-4">1</div>
                                <h4 className="text-xl font-semibold mb-2">Выберите робота</h4>
                                <p className="text-muted-foreground">Определите свой уровень риска и выберите подходящего AI-помощника.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full text-2xl font-bold mb-4">2</div>
                                <h4 className="text-xl font-semibold mb-2">Активируйте AI</h4>
                                <p className="text-muted-foreground">Запустите торговлю одним кликом, и наш AI начнет работу на реальном рынке.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full text-2xl font-bold mb-4">3</div>
                                <h4 className="text-xl font-semibold mb-2">Наблюдайте за ростом</h4>
                                <p className="text-muted-foreground">Следите за результатами в истории торгов и представьте этот доход на реальном счете.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Meta Technology Section */}
                <section className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold">Наша технология от Meta</h3>
                            <p className="text-md text-muted-foreground mt-2">Используем мощь искусственного интеллекта для вашего финансового успеха.</p>
                        </div>
                        <div className="max-w-4xl mx-auto text-center text-lg text-foreground">
                            <p>Платформа <span className="font-semibold text-primary">Facebook AI</span> — это флагманский проект, разработанный ведущими специалистами Meta в области финансовых технологий и искусственного интеллекта. Мы объединили многолетний опыт в анализе данных и машинном обучении для создания уникального инструмента, который делает профессиональный трейдинг доступным для каждого. Наши алгоритмы анализируют миллионы точек данных в секунду, прогнозируя движения рынка с высокой точностью, что позволяет вам получать стабильный доход.</p>
                        </div>
                    </div>
                </section>


                {/* Robots Section */}
                <section className="py-16 md:py-24 bg-card/50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold">Ознакомьтесь с нашими роботами</h3>
                            <p className="text-md text-muted-foreground mt-2">Каждый робот использует уникальную стратегию для достижения ваших целей.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-full">
                                            <Shield className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>Осторожный робот</CardTitle>
                                            <CardDescription>Низкий риск</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground">Идеально подходит для тех, кто ценит безопасность своих вложений. Фокусируется на сохранении капитала и обеспечивает стабильную, хотя и не самую высокую, доходность.</p>
                                </CardContent>
                            </Card>
                            <Card className="flex flex-col border-primary ring-2 ring-primary">
                                <CardHeader>
                                     <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-full">
                                            <GitCompareArrows className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>Сбалансированный робот</CardTitle>
                                            <CardDescription>Средний риск</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground">Золотая середина. Этот робот стремится к балансу между ростом капитала и его сохранением, инвестируя в диверсифицированный портфель активов.</p>
                                </CardContent>
                            </Card>
                             <Card className="flex flex-col">
                                <CardHeader>
                                     <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-full">
                                            <BarChart className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>Робот высокого роста</CardTitle>
                                            <CardDescription>Высокий риск</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground">Для тех, кто готов рисковать ради максимальной прибыли. Этот робот использует агрессивные стратегии и инвестирует в высоковолатильные активы.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
                
                {/* Real Account Section */}
                <section className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold">Перейдите на реальный счет</h3>
                            <p className="text-md text-muted-foreground mt-2">Начните зарабатывать реальные деньги уже сегодня.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h4 className="text-2xl font-semibold mb-4">Активируйте свой потенциал</h4>
                                <p className="text-muted-foreground mb-6">Демо-счет — это отличная возможность убедиться в эффективности наших технологий. Но настоящие возможности открываются с реальным счетом. Переведите свой трейдинг на новый уровень, чтобы выводить прибыль и получать полный доступ ко всем преимуществам платформы.</p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-success mt-1 shrink-0" />
                                        <div>
                                            <h5 className="font-semibold">Вывод реальной прибыли</h5>
                                            <p className="text-muted-foreground text-sm">Вся полученная прибыль доступна для вывода в любое удобное для вас время.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <LifeBuoy className="w-6 h-6 text-success mt-1 shrink-0" />
                                        <div>
                                            <h5 className="font-semibold">Персональная поддержка</h5>
                                            <p className="text-muted-foreground text-sm">Получите доступ к выделенному менеджеру, который поможет на всех этапах работы.</p>
                                        </div>
                                    </li>
                                     <li className="flex items-start gap-3">
                                        <ShieldCheck className="w-6 h-6 text-success mt-1 shrink-0" />
                                        <div>
                                            <h5 className="font-semibold">Полная безопасность</h5>
                                            <p className="text-muted-foreground text-sm">Все ваши средства и данные защищены передовыми протоколами безопасности Meta.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <Card className="p-8 shadow-lg">
                                <CardHeader className="p-0 text-center mb-6">
                                    <CardTitle className="text-2xl">Начать просто</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-4">
                                     <div className="text-center">
                                        <p className="text-muted-foreground">Минимальный депозит для активации:</p>
                                        <p className="text-4xl font-bold text-primary my-2">$150</p>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold mb-2 text-center">Удобные способы пополнения:</h5>
                                        <div className="flex justify-center flex-wrap gap-4 text-muted-foreground">
                                            <span>Visa/Mastercard</span>
                                            <span>Apple/Google Pay</span>
                                            <span>Криптовалюты</span>
                                            <span>Банковский перевод</span>
                                        </div>
                                    </div>
                                    <Button size="lg" className="w-full mt-4" onClick={() => router.push('/trade')}>Активировать реальный счет</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>


                {/* Testimonials Section */}
                <section className="py-16 md:py-24 bg-card/50">
                    <div className="container mx-auto px-6">
                         <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold">Отзывы наших пользователей</h3>
                             <p className="text-md text-muted-foreground mt-2">Узнайте, что говорят о нас те, кто уже зарабатывает с Facebook AI.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <Card className="p-6">
                                <CardContent className="p-0 flex flex-col h-full">
                                    <p className="text-muted-foreground mb-4 flex-grow">"Я был настроен скептически, но демо-счет меня убедил. Запустил робота и просто наблюдал. Результаты говорят сами за себя. Уже перешел на реальный счет."</p>
                                    <div className="flex items-center gap-4 mt-auto">
                                        <Avatar>
                                            <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="man portrait" />
                                            <AvatarFallback>АИ</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">Алексей И.</p>
                                            <p className="text-sm text-muted-foreground">Инвестор</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                             <Card className="p-6">
                                <CardContent className="p-0 flex flex-col h-full">
                                    <p className="text-muted-foreground mb-4 flex-grow">"Лучшее решение для тех, у кого нет времени на анализ рынков. AI делает всю работу. Я просто проверяю баланс и радуюсь прибыли. Рекомендую!"</p>
                                    <div className="flex items-center gap-4 mt-auto">
                                        <Avatar>
                                            <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="woman portrait" />
                                            <AvatarFallback>ЕС</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">Елена С.</p>
                                            <p className="text-sm text-muted-foreground">Предприниматель</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                             <Card className="p-6">
                                <CardContent className="p-0 flex flex-col h-full">
                                    <p className="text-muted-foreground mb-4 flex-grow">"Платформа очень проста в использовании. Никаких сложных графиков и индикаторов, просто выбрал робота и нажал старт. Идеально для новичков."</p>
                                    <div className="flex items-center gap-4 mt-auto">
                                        <Avatar>
                                            <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="man professional" />
                                            <AvatarFallback>ДП</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">Дмитрий П.</p>
                                            <p className="text-sm text-muted-foreground">IT-специалист</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>


                {/* FAQ Section */}
                <section className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-6 max-w-4xl">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold">Часто задаваемые вопросы</h3>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Это действительно бесплатно?</AccordionTrigger>
                                <AccordionContent>
                                    Да, вы получаете полнофункциональный демо-счет с виртуальными $150 абсолютно бесплатно. Это позволяет вам оценить работу наших AI-роботов без каких-либо рисков.
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-2">
                                <AccordionTrigger>Торговля ведется на реальном рынке?</AccordionTrigger>
                                <AccordionContent>
                                    Да. Это ключевое преимущество. Наши роботы используют реальные рыночные данные в реальном времени. Прибыль и убыток на вашем демо-счете — это точные показатели того, как бы вы торговали с реальными деньгами.
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-3">
                                <AccordionTrigger>Как перейти на реальный счет?</AccordionTrigger>
                                <AccordionContent>
                                    Чтобы начать получать реальную прибыль, необходимо активировать ваш торговый счет. Минимальный депозит для активации составляет $150. После пополнения ваш счет будет полностью готов к работе, и вся прибыль будет доступна для вывода.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>Безопасны ли мои средства?</AccordionTrigger>
                                <AccordionContent>
                                    Абсолютно. Мы используем передовые протоколы шифрования и безопасности, разработанные в Meta, для защиты всех транзакций и личных данных. Ваши средства хранятся на сегрегированных счетах в ведущих банках.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-5">
                                <AccordionTrigger>Нужны ли мне специальные знания для трейдинга?</AccordionTrigger>
                                <AccordionContent>
                                    Нет. Наша платформа создана как для новичков, так и для опытных трейдеров. Вам не нужно анализировать графики — всю сложную работу берет на себя AI. Ваша задача — выбрать стратегию и наблюдать за результатом.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-6">
                                <AccordionTrigger>Как я могу вывести прибыль?</AccordionTrigger>
                                <AccordionContent>
                                    Прибыль с демо-счета является виртуальной. Чтобы зарабатывать и выводить реальные деньги, вам необходимо активировать реальный счет, сделав депозит. После активации вы сможете выводить средства в любое время через личный кабинет.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 md:py-32 bg-primary/5">
                    <div className="container mx-auto px-6 text-center">
                        <h3 className="text-3xl md:text-4xl font-bold mb-4">Готовы увидеть AI в действии?</h3>
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
                    <p>&copy; {new Date().getFullYear()} Facebook AI от Meta. Все права защищены.</p>
                </div>
            </footer>
        </div>
    );
}
