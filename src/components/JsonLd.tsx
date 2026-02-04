import Script from 'next/script';

interface JsonLdData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

interface JsonLdProps {
  data: JsonLdData;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
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
}: {
  name: string;
  startDate: string;
  endDate?: string;
  location?: string;
  homeTeam?: string;
  awayTeam?: string;
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    startDate,
    ...(endDate && { endDate }),
    ...(location && { location: { '@type': 'Place', name: location } }),
    ...(homeTeam &&
      awayTeam && {
        competitor: [
          { '@type': 'SportsTeam', name: homeTeam },
          { '@type': 'SportsTeam', name: awayTeam },
        ],
      }),
    sport: '축구',
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
