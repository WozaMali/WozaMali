import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../index.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Woza Mali',
  description: 'Recycling rewards platform',
  icons: {
    icon: '/WozaMali-uploads/w yellow.png',
    shortcut: '/WozaMali-uploads/w yellow.png',
    apple: '/WozaMali-uploads/w yellow.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
