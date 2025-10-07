
import localFont from 'next/font/local'

export const inter = localFont({
  src: [
    {
      path: '/fonts/inter/Inter-Variable.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
})

export const cinzel = localFont({
  src: [
    {
      path: '/fonts/cinzel/Cinzel-Variable.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-cinzel',
  display: 'swap',
})
