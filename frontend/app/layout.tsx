import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SyncWrapper } from "@/components/sync-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PulseGrid ER – Emergency Room Management System",
  description: "Real-time emergency room management: patient triage, bed allocation, and clinical coordination.",
  generator: "v0.app",
};

export const viewport = {
  themeColor: "#1e2a47",
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SyncWrapper>
            {children}
          </SyncWrapper>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
