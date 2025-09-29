import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { SessionTimeoutProvider } from "@/components/providers/SessionTimeoutProvider";
import { LoginStateProvider } from "@/lib/contexts/LoginStateContext";
import { GlobalSidebar } from "@/components/GlobalSidebar";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  title: "SummaQualitas - Sistema de Gestión de Construcción",
  description: "Sistema integral para la gestión de proyectos de construcción, órdenes de cambio y control de calidad.",
  keywords: ["construcción", "gestión de proyectos", "órdenes de cambio", "control de calidad"],
  authors: [{ name: "SummaQualitas" }],
  creator: "SummaQualitas",
  publisher: "SummaQualitas",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SummaQualitas" />
        
        {/* Prevent zoom on input focus in iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} antialiased touch-manipulation`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LoginStateProvider>
            <AuthProvider>
              <SessionTimeoutProvider
                timeoutMinutes={20}
                warningMinutes={5}
                enabled={true}
              >
              <div className="flex min-h-screen bg-background safe-area-inset">
                <GlobalSidebar>
                  <div className="flex flex-col flex-1 min-w-0 w-full lg:w-auto">
                    <ConditionalHeader />
                    
                    <main className="flex-1 w-full">
                      <div className="w-full max-w-none">
                        {children}
                      </div>
                    </main>
                  </div>
                </GlobalSidebar>
              </div>
              
              <ConditionalFooter />
                </SessionTimeoutProvider>
              </AuthProvider>
            </LoginStateProvider>
          <Toaster />
        </ThemeProvider>
        
        {/* Performance and accessibility improvements */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent FOUC (Flash of Unstyled Content)
              document.documentElement.style.visibility = 'visible';
              
              // Improve touch responsiveness
              document.addEventListener('touchstart', function() {}, {passive: true});
              
              // Optimize scroll performance
              let ticking = false;
              function updateScrollPosition() {
                ticking = false;
              }
              document.addEventListener('scroll', function() {
                if (!ticking) {
                  requestAnimationFrame(updateScrollPosition);
                  ticking = true;
                }
              }, {passive: true});
            `,
          }}
        />
      </body>
    </html>
  );
}
