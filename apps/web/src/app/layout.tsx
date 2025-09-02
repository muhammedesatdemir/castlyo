import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/providers/auth-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Castlyo - Profesyonel Casting ve Yetenek Eşleştirme Platformu',
  description: 'Castlyo, yetenekler ve ajanslar arasında köprü kuran profesyonel casting platformudur. Film, dizi, reklam ve daha fazlası için yetenek arayın veya kendinizi keşfedin.',
  keywords: 'casting, yetenek, ajans, film, dizi, reklam, oyuncu, model, müzisyen',
  authors: [{ name: 'Castlyo Teknoloji A.Ş.' }],
  creator: 'Castlyo',
  publisher: 'Castlyo',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://castlyo.com',
    title: 'Castlyo - Profesyonel Casting Platformu',
    description: 'Yetenekler ve ajanslar arasında köprü kuran profesyonel casting platformu',
    siteName: 'Castlyo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Castlyo - Profesyonel Casting Platformu',
    description: 'Yetenekler ve ajanslar arasında köprü kuran profesyonel casting platformu',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
