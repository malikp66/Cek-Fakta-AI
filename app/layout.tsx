import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner"
import './globals.css';
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'CekFakta AI',
  description: 'AI-Powered Indonesian Hoax Detection Platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable, spaceGrotesk.variable)}>
      <body className="antialiased bg-slate-50 text-slate-900 h-screen overflow-hidden flex flex-col" suppressHydrationWarning>
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
        <footer className="h-12 bg-slate-900 flex flex-col sm:flex-row items-center justify-between px-8 text-[10px] text-slate-500 uppercase tracking-widest shrink-0 gap-2 sm:gap-0 justify-center sm:justify-between py-2 sm:py-0 hidden md:flex">
          <div>Sistem AI CekFakta Terbaru</div>
          <div className="flex gap-4">
            <span className="hidden lg:inline">Google Cloud Run</span>
            <span className="text-blue-500 font-bold">Teruji Gemini AI</span>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
