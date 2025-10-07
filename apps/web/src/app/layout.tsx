import type { Metadata, Viewport } from 'next'
import { inter, cinzel } from './fonts'
import { AuthProvider } from '@/providers/auth-provider'
import QueryProvider from '@/providers/query-provider'
import { ToastContainer } from '@/components/ui/toast'
import RoleGateGlobalGuard from '@/components/auth/RoleGateGlobalGuard'
import SessionGuard from '@/components/auth/SessionGuard'
import './globals.css'

export const metadata: Metadata = { /* ... aynı ... */ }
export const viewport: Viewport = { /* ... aynı ... */ }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${cinzel.variable} dark`}>
      <head>
        {/* Poppins linkine ihtiyacımız yok, kaldırdım */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Geliştirici koruması - doğrudan :3001 çağrılarını engelle
                (function() {
                  const _fetch = window.fetch.bind(window);
                  window.fetch = (input, init) => {
                    const url = typeof input === 'string' ? input : input.toString();
                    if (url.startsWith("http://localhost:3001")) {
                      throw new Error("Doğrudan :3001 çağrısı yasak. /api/proxy kullan.");
                    }
                    return _fetch(input, init);
                  };
                })();
              `,
            }}
          />
        )}
      </head>
      {/* bundan sonra default fontu Tailwind 'sans' üzerinden vereceğiz */}
      <body className="font-sans antialiased bg-[#0b0b0f] text-white">
        <QueryProvider>
          <AuthProvider>
            <SessionGuard>
              <div className="min-h-screen">
                {children}
              </div>
            </SessionGuard>
            <ToastContainer />
            <RoleGateGlobalGuard />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
