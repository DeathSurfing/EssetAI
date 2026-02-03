import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

// Editorial display font for headings
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

// Clean geometric sans for body text
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Professional monospace for code/prompts
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "esset.ai | AI Website Builder",
  description: "Transform Google Maps business links into stunning websites with AI. Generate production-ready website prompts and designs instantly.",
  keywords: ["AI website builder", "esset", "website generator", "Google Maps", "AI prompts"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        <ConvexClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                style: {
                  fontFamily: "var(--font-body)",
                },
              }}
            />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
