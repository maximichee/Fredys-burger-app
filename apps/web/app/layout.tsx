import type { Metadata, Viewport } from 'next';
import { Anton, Poppins } from 'next/font/google';
import { CartHydration } from '@/components/CartHydration';
import { MotionProvider } from '@/components/fredys/MotionProvider';
import { RegistrarApp } from '@/components/fredys/App';
import { Analitica } from '@/components/fredys/Analitica';
import { SITE_URL } from '@/lib/sitio';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-anton',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Fredy's Burger | Burgers artesanales · Santa Fe", template: "%s | Fredy's Burger" },
  description: 'Burgers artesanales en pan de papa. Pedí online y retirá en el local o recibila en tu casa. Martes a domingo de 19:30 a 23:30, Santa Fe.',
  keywords: ['hamburguesas', 'Santa Fe', 'artesanales', 'delivery', 'Fredys Burger'],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    title: "Fredy's Burger · Sabor intenso en cada mordida",
    description: 'Burgers artesanales en pan de papa. Pedí online y retirá en el local o recibila en tu casa.',
    siteName: "Fredy's Burger",
    images: [{ url: '/img/rediseno/og-imagen.jpg', width: 1200, height: 630, alt: "Mushroom Burger de Fredy's" }],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/iconos/favicon-48.png', sizes: '48x48', type: 'image/png' }, { url: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/iconos/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: "Fredy's", statusBarStyle: 'black' },
};

export const viewport: Viewport = {
  themeColor: '#0f0b09',
  width: 'device-width',
  initialScale: 1,
};

const schemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': `${SITE_URL}/#restaurante`,
  name: "Fredy's Burger",
  description: 'Burgers artesanales en pan de papa. Pedí online y retirá en el local o recibila en tu casa.',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/img/rediseno/og-imagen.jpg`,
  telephone: '+5493425039876',
  address: { '@type': 'PostalAddress', addressLocality: 'Santa Fe', addressRegion: 'Santa Fe', addressCountry: 'AR' },
  areaServed: { '@type': 'City', name: 'Santa Fe' },
  servesCuisine: ['Hamburguesas', 'Hamburguesas artesanales'],
  priceRange: '$$',
  currenciesAccepted: 'ARS',
  paymentAccepted: 'Efectivo, Transferencia',
  acceptsReservations: false,
  hasMenu: `${SITE_URL}/#menu`,
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    opens: '19:30', closes: '23:30',
  }],
  sameAs: ['https://www.instagram.com/fredysburger/'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${poppins.variable} ${anton.variable}`} suppressHydrationWarning>
      <head>
        {/* Guardia: los estados ocultos para animar solo existen con JS (clase "js") */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body>
        <CartHydration />
        <RegistrarApp />
        <Analitica />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
