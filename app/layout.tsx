import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "AutoKeuze NL — rekenpagina",
  description: "Testpagina voor de reken-engine (Fase 1). Geen financieel advies.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
