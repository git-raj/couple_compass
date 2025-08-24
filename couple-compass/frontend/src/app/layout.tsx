import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Couple Compass',
    default: 'Couple Compass - Strengthen Your Relationship',
  },
  description: 'Strengthen your relationship with personalized insights, mood tracking, and expert guidance.',
  keywords: ['couples', 'relationship', 'therapy', 'mood tracking', 'communication'],
  authors: [{ name: 'Couple Compass Team' }],
  creator: 'Couple Compass',
  publisher: 'Couple Compass',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Couple Compass - Strengthen Your Relationship',
    description: 'Strengthen your relationship with personalized insights, mood tracking, and expert guidance.',
    siteName: 'Couple Compass',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Couple Compass - Strengthen Your Relationship',
    description: 'Strengthen your relationship with personalized insights, mood tracking, and expert guidance.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: '',
    // yandex: '',
    // yahoo: '',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}
