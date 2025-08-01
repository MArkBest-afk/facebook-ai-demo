
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, CreditCard, LifeBuoy, Book, Building, HelpCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function InfoPageContent() {
    const router = useRouter();
    const { t } = useI18n();

    const handleOpenChat = () => {
        router.push('/?openChat=true');
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b sticky top-0 z-10">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-lg sm:text-xl font-headline text-primary flex items-center gap-2">
                           <Image src="/logo.svg" alt="logo" width={28} height={28} className="text-primary h-6 w-6 sm:h-7 sm:w-7" />
                           <span className="truncate">{t('info.title')}</span>
                        </h1>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Bot className="w-6 h-6 text-primary" />
                                <span>{t('info.aboutPlatform.title')}</span>
                            </CardTitle>
                            <CardDescription>{t('info.aboutPlatform.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <p>{t('info.aboutPlatform.p1')}</p>
                            <p>{t('info.aboutPlatform.p2')}</p>
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Building className="w-6 h-6 text-primary" />
                                <span>{t('info.aboutMeta.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <p>{t('info.aboutMeta.p1')}</p>
                            <p>{t('info.aboutMeta.p2')}</p>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-primary" />
                                <span>{t('info.realAccount.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{t('info.realAccount.content', {amount: 150})}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                                <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-center">{t('info.realAccount.method_card')}</div>
                                <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-center">{t('info.realAccount.method_digital')}</div>
                                <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-center">{t('info.realAccount.method_crypto')}</div>
                                <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-center">{t('info.realAccount.method_transfer')}</div>
                            </div>
                             <p className="text-sm font-semibold text-foreground pt-2">{t('info.realAccount.advantages.title')}</p>
                             <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
                                <li>{t('info.realAccount.advantages.p1')}</li>
                                <li>{t('info.realAccount.advantages.p2')}</li>
                                <li>{t('info.realAccount.advantages.p3')}</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Book className="w-6 h-6 text-primary" />
                                <span>{t('info.license.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>{t('info.license.p1')}</p>
                            <p>{t('info.license.p2')}</p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="font-mono bg-muted px-2 py-1 rounded text-xs">CySEC (Cyprus)</span>
                                <span className="font-mono bg-muted px-2 py-1 rounded text-xs">FCA (UK)</span>
                                <span className="font-mono bg-muted px-2 py-1 rounded text-xs">ASIC (Australia)</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <HelpCircle className="w-6 h-6 text-primary" />
                                <span>{t('info.faq.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger className="text-left">{t('info.faq.q1.question')}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {t('info.faq.q1.answer')}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger className="text-left">{t('info.faq.q2.question')}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {t('info.faq.q2.answer', {amount: 150})}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger className="text-left">{t('info.faq.q3.question')}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {t('info.faq.q3.answer')}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger className="text-left">{t('info.faq.q4.question')}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {t('info.faq.q4.answer')}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-3">
                                <LifeBuoy className="w-6 h-6 text-primary" />
                                <span>{t('info.support.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{t('info.support.content')}</p>
                            <Button onClick={handleOpenChat} className="w-full sm:w-auto">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                {t('info.support.button')}
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </main>
             <footer className="bg-card border-t mt-8 sm:mt-12">
                <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Facebook AI by Meta. {t('info.footer.rights')}</p>
                    <p className="mt-2">{t('info.footer.warning')}</p>
                </div>
            </footer>
        </div>
    );
}


export default function InfoPage() {
    return <InfoPageContent />;
}
