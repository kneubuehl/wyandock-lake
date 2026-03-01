import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['600', '700'],
  style: ['italic'],
  variable: '--font-script',
})

export const metadata: Metadata = {
  title: 'Lake Wyandock — Kneubuehl Lake House',
  description: 'Family lake house management — Wyandock Lake, Minocqua, WI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${cormorant.variable}`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
