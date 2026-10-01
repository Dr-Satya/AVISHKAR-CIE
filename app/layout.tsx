import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Registration Portal | GDGU",
  description: "Official Inter-Disciplinary Project (IDP) Registration Portal for G.D. Goenka University",
  icons: {
    icon: "/gdgu-logo.jpeg",
  },
};

export const dynamic = "force-dynamic";

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
      <body className="bg-[#edf1f7] text-[#1e293b] antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
