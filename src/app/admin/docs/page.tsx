
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, BarChart2, Users, User, Bot, Clock, MessageSquare, Flame, AlertTriangle, Link2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function DocsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b sticky top-0 z-10">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-headline text-primary flex items-center gap-2">
                            <BookOpen className="w-6 h-6" />
                            <span>Документация и обучение</span>
                        </h1>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Обзор панели администратора</CardTitle>
                            <CardDescription>
                                Эта страница содержит всю необходимую информацию для эффективного управления пользователями и их торговыми сессиями.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg font-semibold">
                                <div className="flex items-center gap-3">
                                    <BarChart2 className="w-5 h-5 text-primary" />
                                    <span>Главная страница (Dashboard)</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-md mb-2">Статистика пользователей</h3>
                                    <p className="text-muted-foreground">
                                        В верхней части дашборда находятся четыре карточки с ключевыми метриками:
                                    </p>
                                    <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                                        <li><strong className="text-foreground">Всего пользователей:</strong> Общее количество созданных сессий.</li>
                                        <li><strong className="text-foreground">Пользователи онлайн:</strong> Количество пользователей, которые были активны в последнюю минуту.</li>
                                        <li><strong className="text-foreground">Подписанные лиды:</strong> Количество сессий, созданных по специальной ссылке (с `lead_sig`).</li>
                                        <li><strong className="text-foreground">Общий П/У:</strong> Сумма прибылей и убытков по всем пользователям.</li>
                                    </ul>
                                </div>
                                <div className="border-t pt-4">
                                     <h3 className="font-semibold text-md mb-2">Таблица пользователей</h3>
                                    <p className="text-muted-foreground">
                                        Основной элемент дашборда. Каждая строка представляет сессию пользователя и является кликабельной, ведя на его детальную страницу.
                                    </p>
                                    <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                                        <li><strong className="text-foreground">ID, Имя, Баланс, П/У:</strong> Основная информация о пользователе.</li>
                                        <li><strong className="text-foreground">Статус лида:</strong> "Горячий лид" (<Flame className="inline w-4 h-4"/>), если он готов к пополнению (после сбора контактов через чат).</li>
                                        <li><strong className="text-foreground">Статус:</strong> "Онлайн", если пользователь активен.</li>
                                        <li><strong className="text-foreground">Чат:</strong> Показывает статус чата: "Ответ клиента", "AI отвечает", "Вы ответили".</li>
                                        <li><strong className="text-foreground">Подписан:</strong> "Да", если сессия создана по ссылке для лида.</li>
                                        <li><strong className="text-foreground">Последняя активность / Осталось времени:</strong> Показывает, как давно был активен пользователь и сколько времени осталось в его сессии.</li>
                                    </ul>
                                </div>
                                 <div className="border-t pt-4">
                                     <h3 className="font-semibold text-md mb-2">Функции хедера</h3>
                                     <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                                        <li><strong className="text-foreground"><Link2 className="inline w-4 h-4"/> Создать ссылку:</strong> Генерирует уникальную ссылку для отслеживания лидов. Сессии, созданные по этой ссылке, будут иметь статус "Подписан".</li>
                                        <li><strong className="text-foreground"><BookOpen className="inline w-4 h-4"/> Документация:</strong> Переход на эту страницу.</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                             <AccordionTrigger className="text-lg font-semibold">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-primary" />
                                    <span>Страница пользователя</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-6">
                                <div>
                                    <h3 className="font-semibold text-md mb-2 flex items-center gap-2"><User className="w-4 h-4"/> Профиль пользователя</h3>
                                    <p className="text-muted-foreground">Здесь можно изменить имя пользователя, увидеть его статус (онлайн/оффлайн) и посмотреть, подписан ли он.</p>
                                </div>
                                 <div className="border-t pt-4">
                                    <h3 className="font-semibold text-md mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Обнаружены дубликаты</h3>
                                    <p className="text-muted-foreground">Этот блок появляется, если найдены другие сессии с таким же именем. Рекомендуется удалять старые сессии, чтобы избежать путаницы.</p>
                                </div>
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-md mb-2 flex items-center gap-2"><Bot className="w-4 h-4"/> Управление роботом</h3>
                                    <p className="text-muted-foreground">Позволяет выбрать для пользователя одного из трех роботов, запустить или остановить торговлю, а также вручную добавить "Прибыльную" или "Убыточную" сделку для демонстрации.</p>
                                </div>
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-md mb-2 flex items-center gap-2"><Clock className="w-4 h-4"/> Управление сессией</h3>
                                    <p className="text-muted-foreground">Здесь отображается оставшееся время сессии. Вы можете вручную продлить сессию на 15 минут, 1 час или 4 часа, чтобы удержать перспективного клиента.</p>
                                </div>
                                 <div className="border-t pt-4">
                                    <h3 className="font-semibold text-md mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Чат с клиентом</h3>
                                    <p className="text-muted-foreground">Ключевой инструмент для взаимодействия.</p>
                                     <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                                        <li><strong className="text-foreground">AI Ассистент:</strong> Можно включить или выключить AI-помощника для этого пользователя.</li>
                                        <li><strong className="text-foreground">Окно чата:</strong> Позволяет вести переписку в реальном времени.</li>
                                        <li><strong className="text-foreground">Платежи (<CreditCard className="inline w-4 h-4"/>):</strong> Кнопка для отправки платежных реквизитов или ссылки на оплату.</li>
                                        <li><strong className="text-foreground">Удаление:</strong> Можно удалить отдельные сообщения или очистить всю историю чата (<Trash2 className="inline w-4 h-4"/>).</li>
                                    </ul>
                                </div>
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-md mb-2">Прочие блоки</h3>
                                    <p className="text-muted-foreground">Также на странице доступны блоки для просмотра IP-адреса и местоположения клиента, блокировки доступа, изменения баланса и П/У, просмотра истории торгов и добавления внутренних комментариев.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-3">
                             <AccordionTrigger className="text-lg font-semibold">
                                <div className="flex items-center gap-3">
                                    <Flame className="w-5 h-5 text-primary" />
                                    <span>Работа с "горячим лидом"</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-4">
                                <p className="text-muted-foreground">
                                    Основная цель — довести клиента до состояния готовности внести депозит.
                                </p>
                                <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                                    <li>
                                        <strong className="text-foreground">Взаимодействие в чате:</strong> Используйте AI-ассистента или общайтесь вручную, чтобы убедить клиента в эффективности платформы. Подчеркивайте, что прибыль на демо-счете могла бы быть реальной.
                                    </li>
                                     <li>
                                        <strong className="text-foreground">Сбор контактов:</strong> Когда клиент выражает готовность ("я готов пополнить", "как оплатить?"), AI (или вы) должен запросить его Имя, Фамилию, Телефон и Email.
                                    </li>
                                     <li>
                                        <strong className="text-foreground">Конвертация в "Горячий лид":</strong> Как только AI успешно соберет все данные, он автоматически сохранит их и пометит пользователя как "Горячий лид". В дашборде он будет подсвечен иконкой <Flame className="inline w-4 h-4"/>.
                                    </li>
                                     <li>
                                        <strong className="text-foreground">Завершение сделки:</strong> После этого AI отправляет финальное сообщение о том, что менеджер скоро подключится. На этом этапе вы должны взять общение на себя, чтобы завершить процесс пополнения.
                                    </li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </main>
        </div>
    );
}


    