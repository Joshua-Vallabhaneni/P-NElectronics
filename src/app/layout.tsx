import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/common/AuthGuard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BackgroundGlow } from '@/components/ui/background-glow';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'P&N Electronics',
  description: 'Secure IT Asset Disposition',
  keywords: ['ITAD', 'IT Asset Disposition', 'e-waste recycling', 'data destruction', 'tech recycling', 'refurbished electronics'],
  openGraph: {
    title: 'P&N Electronics',
    description: 'Secure IT Asset Disposition',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'P&N Electronics',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <AuthGuard>
            <BackgroundGlow />
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </AuthGuard>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
