import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import WhatsAppButton from "@/components/WhatsAppButton"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://summaqualitas.com'),
  title: "Summa Qualitas Architecture and Construction",
  description: "Summa Qualitas is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
  keywords: "construction, building, projects, architecture, engineering",
  authors: [{ name: "Temsa Tecnología", url: "https://crtemsa.com" }],
  openGraph: {
    title: "Summa Qualitas Architecture and Construction",
    description: "Summa Qualitas is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
    url: 'https://summaqualitas.com',
    siteName: 'Summa Qualitas',
    images: [
      {
        url: '/images/logo.webp',
        width: 1200,
        height: 630,
        alt: 'Summa Qualitas Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Summa Qualitas Architecture and Construction",
    description: "Summa Qualitas is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
    images: ['/images/logo.webp'],
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
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  )
}
