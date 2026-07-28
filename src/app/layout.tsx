import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LearnUDD - Tu comunidad académica UDD",
  description:
    "Marketplace universitario de apuntes y clases particulares para estudiantes verificados de la Universidad del Desarrollo.",
  keywords: [
    "UDD",
    "apuntes",
    "clases particulares",
    "tutoría",
    "universidad",
    "Chile",
  ],
  openGraph: {
    title: "LearnUDD",
    description: "Tu comunidad académica UDD, en un solo lugar",
    type: "website",
    locale: "es_CL",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <div className="mobile-container">{children}</div>
      </body>
    </html>
  );
}
