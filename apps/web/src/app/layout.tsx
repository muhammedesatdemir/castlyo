import type { Metadata, Viewport } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import { AuthProvider } from '@/providers/auth-provider'
import { ToastContainer } from '@/components/ui/toast'
import { ApiHealthCheck } from '@/components/dev/ApiHealthCheck'
import RoleGateGlobalGuard from '@/components/auth/RoleGateGlobalGuard'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700', '900'], // 800 yok; 900 kullan
  variable: '--font-cinzel',
})

export const metadata: Metadata = { /* ... aynı ... */ }
export const viewport: Viewport = { /* ... aynı ... */ }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${cinzel.variable}`}>
      <head>
        {/* Poppins linkine ihtiyacımız yok, kaldırdım */}
      </head>
      {/* bundan sonra default fontu Tailwind 'sans' üzerinden vereceğiz */}
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <ToastContainer />
          <RoleGateGlobalGuard />
          {process.env.NODE_ENV === 'development' && <ApiHealthCheck />}
        </AuthProvider>
      </body>
    </html>
  )
}
