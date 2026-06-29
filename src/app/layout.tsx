import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { ChatPanel } from "@/components/ai/chat-panel"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"

const inter = Inter({ subsets: ["latin"] })

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "OpenObsidian",
  description: "Local-first knowledge management powered by DCMA cognitive engine.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <KeyboardShortcuts>
            {children}
            <ChatPanel />
          </KeyboardShortcuts>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
