import Script from 'next/script';

interface JsonLdData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

interface JsonLdProps {
  data: JsonLdData;
}

export function JsonLd({ data, id }: JsonLdProps & { id?: string }) {
  const scriptId =
    id || `json-ld-${data['@type']?.toString().toLowerCase() || 'default'}`;
  return (
    <Script
      id={scriptId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

// 웹사이트 구조화 데이터
export function WebsiteJsonLd() {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '골 때리는 그녀들 데이터 센터',
    alternateName: '골때녀 데이터 센터',
    url: 'https://www.gtndatacenter.com',
    description:
      '골 때리는 그녀들 경기/선수/팀 데이터를 구조화하여 빠르게 탐색할 수 있는 데이터 아카이브',
    inLanguage: 'ko-KR',
    publisher: {
      '@type': 'Organization',
      name: '골 때리는 그녀들 데이터 센터',
      url: 'https://www.gtndatacenter.com',
    },
  };

  return <JsonLd data={data} />;
}

// 조직 구조화 데이터
export function OrganizationJsonLd() {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '골 때리는 그녀들 데이터 센터',
    url: 'https://www.gtndatacenter.com',
    logo: 'https://www.gtndatacenter.com/icon.png',
    description:
      '골 때리는 그녀들 경기/선수/팀 데이터를 구조화하여 빠르게 탐색할 수 있는 데이터 아카이브',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Korean'],
    },
  };

  return <JsonLd data={data} />;
}

// 스포츠 이벤트 구조화 데이터
export function SportsEventJsonLd({
  name,
  startDate,
  endDate,
  location,
  homeTeam,
  awayTeam,
  description,
  image,
  seasonName,
}: {
  name: string;
  startDate: string;
  endDate?: string;
  location?: string;
  homeTeam?: string;
  awayTeam?: string;
  description?: string;
  image?: string;
  seasonName?: string;
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    startDate,
    ...(endDate && { endDate }),
    location: {
      '@type': 'Place',
      name: location || 'SBS 프리즘타워',
      address: {
        '@type': 'PostalAddress',
        addressLocality: '서울',
        addressCountry: 'KR',
      },
    },
    description:
      description ||
      `골 때리는 그녀들 ${homeTeam || ''} vs ${awayTeam || ''} 경기`,
    organizer: {
      '@type': 'Organization',
      name: 'SBS',
      url: 'https://www.sbs.co.kr',
    },
    ...(homeTeam &&
      awayTeam && {
        competitor: [
          { '@type': 'SportsTeam', name: homeTeam },
          { '@type': 'SportsTeam', name: awayTeam },
        ],
        performer: [
          { '@type': 'SportsTeam', name: homeTeam },
          { '@type': 'SportsTeam', name: awayTeam },
        ],
      }),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: 'https://www.gtndatacenter.com',
      description: 'SBS 방송으로 무료 시청 가능',
    },
    image: image || 'https://www.gtndatacenter.com/og-image.png',
    sport: '축구',
    ...(seasonName && {
      eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    }),
    inLanguage: 'ko-KR',
  };

  return <JsonLd data={data} />;
}

// 스포츠 팀 구조화 데이터
export function SportsTeamJsonLd({
  name,
  description,
  foundedYear,
}: {
  name: string;
  description?: string;
  foundedYear?: number;
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name,
    ...(description && { description }),
    ...(foundedYear && { foundingDate: `${foundedYear}-01-01` }),
    sport: '축구',
    inLanguage: 'ko-KR',
  };

  return <JsonLd data={data} />;
}

// 사람 구조화 데이터 (선수/감독용)
export function PersonJsonLd({
  name,
  description,
  birthDate,
  nationality,
}: {
  name: string;
  description?: string;
  birthDate?: string;
  nationality?: string;
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(description && { description }),
    ...(birthDate && { birthDate }),
    ...(nationality && { nationality }),
    inLanguage: 'ko-KR',
  };

  return <JsonLd data={data} />;
}
