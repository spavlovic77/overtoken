import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/lib/theme-provider"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://overtoken.app"
const siteName = "overtoken"
const siteDescription =
  "Verify that a token was signed by a trusted external system. Public-key signature verification (RSA-PSS / SHA-256) over a DIC1:DIC2 message."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "overtoken — Verification token service",
    template: "%s | overtoken",
  },
  description: siteDescription,
  authors: [{ name: "overtoken" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "overtoken — Verification token service",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "overtoken — Verification token service",
    description: siteDescription,
  },
  alternates: {
    canonical: siteUrl,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
