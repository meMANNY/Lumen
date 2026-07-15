import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { auth } from '@/auth'
import ToasterContext from './context/ToasterContext'
import AuthContext from './context/AuthContext'
import ActiveStatus from './components/ActiveStatus'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Messenger clone',
  description: 'Messenger clone',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.className}>

      <AuthContext session={session}>
          <ToasterContext/>
          <ActiveStatus/>
          {children}
        </AuthContext>
        </body>
    </html>
  )
}
