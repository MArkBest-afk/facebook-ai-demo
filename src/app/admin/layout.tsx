import { Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-center gap-4 mb-8">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-headline text-primary">Admin Panel</h1>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
