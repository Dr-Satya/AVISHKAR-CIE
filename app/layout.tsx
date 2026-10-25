/**
 * G D Goenka University - Inter-Disciplinary Project (IDP) Portal
 * 
 * Code Attribution:
 * - Dr. Satya Prakash (Avishkar Centre for Innovation and Entrepreneurship,
 *   School of Engineering and Sciences, G D Goenka University, Haryana)
 * - Potla Sri Sharan
 * - Sarthak Singh
 * 
 * Licensed under the Apache License, Version 2.0.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IDP (Inter-Disciplinary Project) Portal | GDGU",
  description: "Official IDP (Inter-Disciplinary Project) Portal for G D Goenka University",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  var msg = (e && (e.message || (e.error && e.error.message))) || '';
                  if (typeof msg === 'string' && (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1)) {
                    var last = sessionStorage.getItem('chunk_err_reload');
                    var now = Date.now();
                    if (!last || (now - parseInt(last, 10)) > 8000) {
                      sessionStorage.setItem('chunk_err_reload', now.toString());
                      window.location.reload();
                    }
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-[#f8fafc] text-[#09131f] selection:bg-[#c59b27]/20 selection:text-[#0a192f] antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
