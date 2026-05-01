import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniConvert | Premium Document Converter",
  description: "Convert between PDF and Word formats instantly. Supports Telugu, Hindi, and English with high fidelity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
