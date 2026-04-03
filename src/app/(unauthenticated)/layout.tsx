import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { UnauthenticatedChrome } from "./_components/unauthenticated-chrome";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Balad'indice",
    template: "%s — Balad'indice",
  },
  description:
    "Balad'indice — quêtes et balades en famille, connexion et informations.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={cn(
        "scroll-smooth scroll-pt-19 font-mono",
        jetbrainsMono.variable
      )}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UnauthenticatedChrome>
          <main
            id="contenu-principal"
            className="flex min-h-0 min-w-0 w-full flex-1 flex-col"
          >
            {children}
          </main>
        </UnauthenticatedChrome>
      </body>
    </html>
  );
}
