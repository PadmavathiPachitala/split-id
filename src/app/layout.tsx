import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ToastProvider } from '@/components/Toast'
import Navbar from '@/components/Navbar'
import CustomCursor from '@/components/CustomCursor'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['500'],
})

export const metadata: Metadata = {
  title: 'SplitID — Financial Precision for Groups',
  description:
    'The financial layer for social coordination. Share a unique Split ID, automate debt simplification, and settle group expenses with zero friction.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased text-foreground bg-background relative min-h-screen">
        <ThemeProvider>
          <ToastProvider>
            {/* Custom trailing mouse pointer */}
            <CustomCursor />

            {/* Animated meshes and orbs */}
            <div className="mesh-bg"></div>
            <div className="orb" style={{ top: '-10%', left: '-10%' }}></div>
            <div
              className="orb"
              style={{ bottom: '-10%', right: '-10%', animationDelay: '-5s' }}
            ></div>
            <div className="noise"></div>

            {/* Floating Navigation */}
            <Navbar />

            {/* Main Workspace */}
            <div className="min-h-screen relative z-10">{children}</div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
