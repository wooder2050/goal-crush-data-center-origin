import './globals.css';

import type { Metadata } from 'next';
import Script from 'next/script';

import { AdminNavItem } from '@/components/AdminNavItem';
import { AuthButtons } from '@/components/AuthButtons';
import { AuthProvider } from '@/components/AuthProvider';
import Footer from '@/components/Footer';
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/JsonLd';
import { Navigation } from '@/components/Navigation';
import { NicknameSetupModal } from '@/components/NicknameSetupModal';
import { Header } from '@/components/ui/header';
import { Providers } from '@/lib/providers';

import ScrollToTopOnRouteChange from './ScrollToTopOnRouteChange';

// 네비게이션 메뉴 설정
const NAV_ITEMS = [
  { href: '/', label: '홈', requireAuth: false },
  { href: '/seasons', label: '시즌', requireAuth: false },
  { href: '/teams', label: '팀', requireAuth: false },
  { href: '/players', label: '선수', requireAuth: false },
  { href: '/coaches', label: '감독', requireAuth: false },
  { href: '/stats', label: '통계', requireAuth: false },
] as const;

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gtndatacenter.com'),
  title: {
    default: '골 때리는 그녀들 데이터 센터',
    template: '%s | 골때녀 데이터센터',
  },
  description:
    '골 때리는 그녀들(골때녀) 경기 결과, 선수 기록, 팀 순위, 시즌 통계를 한눈에 확인할 수 있는 팬 데이터 센터',
  applicationName: 'Goal Crush Data Center',
  keywords: [
    '골때리는 그녀들',
    '골 때리는 그녀들',
    '골때녀',
    '골때리는 그녀들 순위',
    '골 때리는 그녀들 순위',
    '골때녀 순위',
    '골때리는 그녀들 순위표',
    '골 때리는 그녀들 순위표',
    '골때녀 순위표',
    '골 때리는 그녀들 선수 정보',
    '골때녀 선수',
    '골때녀 데이터',
    '데이터 센터',
    '시즌',
    '선수',
    '팀',
    '통계',
    '여자축구',
    '축구데이터',
    '경기결과',
    '선수기록',
    '팀순위',
  ],
  authors: [{ name: '골 때리는 그녀들 데이터 센터' }],
  creator: '골 때리는 그녀들 데이터 센터',
  publisher: '골 때리는 그녀들 데이터 센터',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    'google-adsense-account': 'ca-pub-6439388251426570',
    'naver-site-verification': 'a955c718677355e614dd456531f4ecd98fbd1294',
    'msapplication-TileColor': '#000000',
    'theme-color': '#000000',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '골 때리는 그녀들 데이터 센터',
    title: '골 때리는 그녀들 데이터 센터',
    description:
      '골 때리는 그녀들(골때녀) 경기 결과, 선수 기록, 팀 순위, 시즌 통계를 한눈에 확인할 수 있는 팬 데이터 센터',
    url: 'https://www.gtndatacenter.com',
    images: [
      {
        url: 'https://ppqctvmpsmlagsmmmdee.supabase.co/storage/v1/object/sign/playerprofile/mwE1721003437663.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZWM2YjcyNS1hYWJjLTQzOGUtODkzMi00NDU1ZmM1ZGEyY2EiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwbGF5ZXJwcm9maWxlL213RTE3MjEwMDM0Mzc2NjMuanBnIiwiaWF0IjoxNzU1MTY2Njk5LCJleHAiOjIwNzA1MjY2OTl9.c0a4K6VimPMfItbZq1rjL5TEWhcC_319UMgLRRSj9sI',
        width: 1200,
        height: 630,
        alt: '골 때리는 그녀들 데이터 센터',
      },
    ],
    countryName: '대한민국',
    ttl: 86400,
  },
  twitter: {
    card: 'summary_large_image',
    title: '골 때리는 그녀들 데이터 센터',
    description:
      '골 때리는 그녀들(골때녀) 경기 결과, 선수 기록, 팀 순위, 시즌 통계를 한눈에 확인할 수 있는 팬 데이터 센터',
    images: [
      'https://ppqctvmpsmlagsmmmdee.supabase.co/storage/v1/object/sign/playerprofile/mwE1721003437663.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZWM2YjcyNS1hYWJjLTQzOGUtODkzMi00NDU1ZmM1ZGEyY2EiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwbGF5ZXJwcm9maWxlL213RTE3MjEwMDM0Mzc2NjMuanBnIiwiaWF0IjoxNzU1MTY2Njk5LCJleHAiOjIwNzA1MjY2OTl9.c0a4K6VimPMfItbZq1rjL5TEWhcC_319UMgLRRSj9sI',
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="ko">
        <head>
          <WebsiteJsonLd />
          <OrganizationJsonLd />
        </head>
        <body className="font-sans antialiased">
          {/* Google Analytics (gtag.js) */}
          {process.env.NEXT_PUBLIC_GA_ID && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                strategy="afterInteractive"
              />
              <Script id="ga" strategy="afterInteractive">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
              `}
              </Script>
            </>
          )}

          {/* Google AdSense */}
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          <Script id="gtm" strategy="afterInteractive">
            {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID || ''}');
          `}
          </Script>
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID || ''}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            }}
          />
          <Providers>
            <Header authButtons={<AuthButtons />}>
              <Navigation navItems={NAV_ITEMS} />
              <AdminNavItem />
            </Header>
            <div className="pt-24 md:pt-28">
              <ScrollToTopOnRouteChange />
              <NicknameSetupModal />
              <div className="min-h-screen">{children}</div>
              <Footer />
            </div>
          </Providers>
        </body>
      </html>
    </AuthProvider>
  );
}
