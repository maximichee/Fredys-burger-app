import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { CartHydration } from '@/components/CartHydration';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Fredys Burger | Hamburguesas Artesanales · Santa Fe', template: '%s | Fredys Burger' },
  description: 'Las mejores hamburguesas artesanales de Santa Fe. Pedí online, retirá en el local o recibí a domicilio. Martes a domingo 19:30–23:30hs.',
  keywords: ['hamburguesas', 'Santa Fe', 'artesanales', 'delivery', 'Fredys Burger'],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    title: 'Fredys Burger | Hamburguesas Artesanales',
    description: 'Las mejores hamburguesas artesanales de Santa Fe.',
    siteName: 'Fredys Burger',
  },
  manifest: '/manifest.json',
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export const viewport: Viewport = {
  themeColor: '#fb8500',
  width: 'device-width',
  initialScale: 1,
};

const schemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Fredys Burger',
  description: 'Las mejores hamburguesas artesanales de Santa Fe.',
  telephone: '+5493425039876',
  address: { '@type': 'PostalAddress', addressLocality: 'Santa Fe', addressCountry: 'AR' },
  servesCuisine: 'Hamburguesas artesanales',
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    opens: '19:30', closes: '23:30',
  }],
  sameAs: ['https://www.instagram.com/fredysburger/'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body>
        <CartHydration />
        {children}
      </body>
    </html>
  );
}
