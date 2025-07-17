'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { LogOut, Home } from "lucide-react";

export default function AdminDashboardPage() {
    const router = useRouter();

    const handleLogout = () => {
        try {
            sessionStorage.removeItem('isAdminAuthenticated');
        } catch (error) {
            console.error("Could not remove item from sessionStorage", error);
        }
        router.replace('/admin');
    };

    const handleGoHome = () => {
        router.push('/');
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-headline text-primary">Admin Dashboard</h1>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={handleGoHome}>
                            <Home className="mr-2 h-4 w-4" />
                            Main App
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome, Admin!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">This is your protected admin dashboard. You can add management features here.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">User statistics and analytics will be displayed here.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Application settings and configurations will be managed from here.</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
