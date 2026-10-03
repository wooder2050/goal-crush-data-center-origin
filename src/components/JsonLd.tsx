interface JsonLdData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

interface JsonLdProps {
  data: JsonLdData;
}

/**
 * 구조화 데이터는 일반 <script>로 서버 HTML에 출력한다.
 * next/script는 id로 로드 여부를 캐시해 클라이언트 이동(경기 A→B) 시 이전 페이지
 * 데이터가 남을 수 있다(Next.js 권장 방식). `<`는 이스케이프해 본문 문자열이
 * </script>를 닫지 못하게 한다.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
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
    alternateName: '골때녀 데이터센터',
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

// 스포츠 이벤트 구조화 데이터 — 방송 경기 기록. 장소·종료 시각·관람 정보처럼
// 실제 데이터가 없는 값은 만들어 넣지 않는다
export function SportsEventJsonLd({
  name,
  startDate,
  location,
  homeTeam,
  awayTeam,
  description,
  image,
  status,
}: {
  name: string;
  startDate: string;
  location?: string;
  homeTeam?: string;
  awayTeam?: string;
  description?: string;
  image?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    ...(startDate && { startDate }),
    eventStatus:
      status === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    ...(location && { location: { '@type': 'Place', name: location } }),
    ...(description && { description }),
    organizer: {
      '@type': 'Organization',
      name: 'SBS',
      url: 'https://www.sbs.co.kr',
    },
    ...(homeTeam && { homeTeam: { '@type': 'SportsTeam', name: homeTeam } }),
    ...(awayTeam && { awayTeam: { '@type': 'SportsTeam', name: awayTeam } }),
    ...(image && { image }),
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
  logo,
  url,
  coach,
}: {
  name: string;
  description?: string;
  foundedYear?: number;
  logo?: string;
  url?: string;
  coach?: string;
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name,
    ...(description && { description }),
    ...(foundedYear && { foundingDate: `${foundedYear}-01-01` }),
    ...(logo && { logo }),
    ...(url && { url }),
    ...(coach && { coach: { '@type': 'Person', name: coach } }),
    sport: '축구',
    memberOf: {
      '@type': 'SportsOrganization',
      name: '골 때리는 그녀들',
    },
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
  image,
  url,
  teamName,
  position,
  height,
  weight,
  stats,
}: {
  name: string;
  description?: string;
  birthDate?: string;
  nationality?: string;
  image?: string;
  url?: string;
  teamName?: string;
  position?: string;
  height?: number;
  weight?: number;
  stats?: { matches: number; goals: number; assists: number };
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(description && { description }),
    ...(birthDate && { birthDate }),
    ...(nationality && {
      nationality: { '@type': 'Country', name: nationality },
    }),
    ...(image && { image }),
    ...(url && { url }),
    ...(height && { height: `${height}cm` }),
    ...(weight && { weight: `${weight}kg` }),
    ...(teamName && {
      memberOf: {
        '@type': 'SportsTeam',
        name: teamName,
        memberOf: {
          '@type': 'SportsOrganization',
          name: '골 때리는 그녀들',
        },
      },
    }),
    ...(position && { jobTitle: position }),
    ...(stats && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: '통산 경기',
          value: stats.matches,
        },
        { '@type': 'PropertyValue', name: '통산 골', value: stats.goals },
        {
          '@type': 'PropertyValue',
          name: '통산 도움',
          value: stats.assists,
        },
      ],
    }),
    knowsAbout: 'Soccer',
    inLanguage: 'ko-KR',
  };

  return <JsonLd data={data} />;
}

// 시즌 구조화 데이터
export function SeasonJsonLd({
  name,
  description,
  startDate,
  endDate,
  url,
}: {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: `골 때리는 그녀들 ${name}`,
    ...(description && { description }),
    sport: '축구',
    ...(url && { url }),
    event: {
      '@type': 'SportsEvent',
      name,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      sport: '축구',
      organizer: {
        '@type': 'Organization',
        name: 'SBS',
      },
    },
    inLanguage: 'ko-KR',
  };

  return <JsonLd data={data} />;
}

// FAQ 구조화 데이터
export function FAQPageJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const data: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}
