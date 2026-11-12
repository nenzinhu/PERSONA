import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: "../public/fonts/geist.ttf",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});
const mono = localFont({
  src: "../public/fonts/geist-mono.ttf",
  weight: "100 900",
  variable: "--font-mono",
  display: "swap",
});
const serif = localFont({
  src: [
    { path: "../public/fonts/instrument-serif.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/instrument-serif-italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Persona · Gerador de Respostas",
  applicationName: "Persona",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Persona" },
  icons: { icon: { url: "/icons/persona.svg", type: "image/svg+xml" }, apple: "/icons/icon-192.png" },
  description: "Gere respostas para perguntas e afirmações com o seu jeito de escrever.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#181622" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
