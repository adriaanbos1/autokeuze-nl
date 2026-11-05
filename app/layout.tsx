import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "AutoKeuze NL",
  description: "Onafhankelijk vergelijken welke auto bij je past en wat hij echt kost. Geen financieel advies.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <a href="#inhoud" className="overslaan">
          Naar de inhoud
        </a>
        {children}
      </body>
    </html>
  );
}
