import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { NavBar } from "@/components/NavBar";
import { AIChatbot } from "@/components/AIChatbot";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "HelpCorps | Community Support Platform",
  description:
    "Rapid-response mutual aid and civic resilience network engineered for high-accessibility and emergency relief.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${jakarta.variable} bg-surface font-body-md text-body-md text-on-surface antialiased`}
      >
        <Providers>
          <NavBar />
          {children}
          <AIChatbot />
        </Providers>
      </body>
    </html>
  );
}
