import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formulaire client énergie",
  description: "Formulaire client connecté à Make via une API Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
