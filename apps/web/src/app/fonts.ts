
import localFont from 'next/font/local'

export const inter = localFont({
  src: [
    {
      path: '../../public/fonts/inter/Inter-Variable.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
})

export const cinzel = localFont({
  src: [
    {
      path: '../../public/fonts/cinzel/Cinzel-Variable.woff2',
      weight: '400 900',
      style: 'normal',
    },
  ],
  variable: '--font-cinzel',
  display: 'swap',
})
