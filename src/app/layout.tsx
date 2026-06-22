import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";

// Наборный шрифт — Inter (кириллица), деловой швейцарский гротеск (замена Suisse Intl)
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

// Акцидентный — Unbounded: широкий геометрический гротеск, футуризм бренда MR
const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Калькулятор тарифов УК",
  description: "Расчёт тарифов для управляющей компании",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${unbounded.variable}`}>
      <body>{children}</body>
    </html>
  );
}
