import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Registration Portal | GDGU",
  description: "Official Inter-Disciplinary Project (IDP) Registration Portal for G.D. Goenka University",
  icons: {
    icon: "/gdgu-logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#edf1f7] text-[#1e293b] antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
