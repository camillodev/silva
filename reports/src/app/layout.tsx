import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports Dashboard — Rafael Camillo',
  description: 'Dashboard de análises e relatórios de investimentos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: 'Inter, sans-serif' }}>{children}</body>
    </html>
  )
}
