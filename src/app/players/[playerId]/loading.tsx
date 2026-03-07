import { Card, CardContent, Grid, Section } from '@/components/ui';

export default function Loading() {
  return (
    <Section padding="sm">
      <div className="mb-6">
        <div className="h-8 w-44 rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="space-y-6">
        <Grid cols={4} gap="lg">
          <Card className="col-span-4 md:col-span-2 overflow-hidden">
            <div className="h-64 w-full animate-pulse bg-gray-100" />
            <CardContent>
              <div className="mt-3 h-5 w-1/2 rounded bg-gray-100 animate-pulse" />
              <div className="mt-2 h-4 w-1/3 rounded bg-gray-100 animate-pulse" />
            </CardContent>
          </Card>

          <Card className="col-span-4 md:col-span-2">
            <CardContent>
              <div className="mt-3 space-y-3">
                <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 rounded bg-gray-100 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 rounded bg-gray-100 animate-pulse" />
                  <div className="h-8 w-24 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                  <div className="h-6 w-16 rounded bg-gray-100 animate-pulse" />
                </div>
                <div className="h-64 w-full rounded bg-gray-100 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                  <div className="h-12 w-full rounded bg-gray-100 animate-pulse" />
                  <div className="h-12 w-full rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </div>
    </Section>
  );
}
