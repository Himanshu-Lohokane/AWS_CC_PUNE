import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'AWS Cloud Club ADYPSOE | Learn. Build. Innovate.',
  description:
    'AWS Cloud Club at Ajeenkya DY Patil School of Engineering, Pune — a student-led community turning beginners into cloud builders on AWS.',
  keywords: 'AWS Cloud Club, ADYPSOE, Pune, AWS, cloud computing, student community',
  openGraph: {
    title: 'AWS Cloud Club ADYPSOE | awspune.in',
    description: 'Learn. Build. Innovate. Join the AWS Cloud Club at ADYPSOE, Pune.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
