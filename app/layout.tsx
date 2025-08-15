import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import WhatsAppButton from "@/components/WhatsAppButton"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Summa Qualitas Architecture and Construction",
  description: "Summa Qualitas is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
  keywords: "construction, building, projects, architecture, engineering",
  authors: [{ name: "Temsa Tecnología", url: "https://crtemsa.com" }],
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
