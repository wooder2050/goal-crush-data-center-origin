import { NextResponse } from 'next/server';

import { getHomePageData } from '@/features/home/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getHomePageData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch home page data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home page data' },
      { status: 500 }
    );
  }
}
