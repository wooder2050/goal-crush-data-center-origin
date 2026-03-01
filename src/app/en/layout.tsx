import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'Kick a Goal Stats - Player Statistics & Match Results',
    template: '%s | Kick a Goal Stats',
  },
  description:
    'Comprehensive statistics, standings, and match results for SBS Kick a Goal (골 때리는 그녀들). Track player goals, assists, ratings, and career records.',
  keywords: [
    'Kick a Goal',
    'Kick a Goal stats',
    'Kick a Goal players',
    'Kick a Goal standings',
    'Kick a Goal match results',
    'SBS Kick a Goal',
    'Shooting Stars',
    '골 때리는 그녀들',
    '골때녀',
    'Korean women football variety show',
    'Korean celebrity soccer',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Kick a Goal Stats',
    title: 'Kick a Goal Stats - Player Statistics & Match Results',
    description:
      'Comprehensive statistics, standings, and match results for SBS Kick a Goal (골 때리는 그녀들).',
    url: 'https://www.gtndatacenter.com/en',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kick a Goal Stats - Player Statistics & Match Results',
    description:
      'Comprehensive statistics, standings, and match results for SBS Kick a Goal (골 때리는 그녀들).',
  },
  alternates: {
    canonical: '/en',
    languages: {
      ko: '/',
      en: '/en',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="mb-4 flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/en" className="text-lg font-bold text-gray-900">
            Kick a Goal Stats
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            한국어
          </Link>
          <span className="font-medium text-gray-900">English</span>
        </div>
      </nav>
      {children}
      <footer className="mt-12 border-t border-gray-200 px-4 py-6 text-center text-xs text-gray-500">
        <p>
          Kick a Goal (골 때리는 그녀들) Data Center — Fan-created statistics
          archive
        </p>
        <p className="mt-1">
          Player and team names are shown in their original Korean as proper
          nouns.
        </p>
      </footer>
    </>
  );
}
