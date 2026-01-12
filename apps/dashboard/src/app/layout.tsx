import type { Metadata } from "next"
import localFont from "next/font/local"
import { JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

// Body font - General Sans (Variable)
const generalSans = localFont({
  src: [
    {
      path: "../fonts/GeneralSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/GeneralSans-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/GeneralSans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/GeneralSans-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/GeneralSans-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/GeneralSans-SemiboldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../fonts/GeneralSans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/GeneralSans-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-general-sans",
  display: "swap",
})

// Heading font - Clash Display
const clashDisplay = localFont({
  src: [
    {
      path: "../fonts/ClashDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/ClashDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/ClashDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-clash-display",
  display: "swap",
})

// Code font - JetBrains Mono
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Trafi Dashboard",
  description: "Admin interface for Trafi commerce platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${generalSans.variable} ${clashDisplay.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
