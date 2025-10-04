import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function JobsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse bg-[#0B0F1A] border-[#F6E6C3]/20">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-[#F6E6C3]/20 rounded"></div>
                <div className="h-5 w-12 bg-[#F6E6C3]/20 rounded"></div>
              </div>
              <div className="h-6 w-3/4 bg-[#F6E6C3]/20 rounded"></div>
              <div className="h-4 w-1/2 bg-[#F6E6C3]/20 rounded"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="h-4 w-full bg-[#F6E6C3]/20 rounded"></div>
                <div className="h-4 w-5/6 bg-[#F6E6C3]/20 rounded"></div>
                <div className="h-4 w-4/6 bg-[#F6E6C3]/20 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-1/3 bg-[#F6E6C3]/20 rounded"></div>
                <div className="h-4 w-1/4 bg-[#F6E6C3]/20 rounded"></div>
                <div className="h-4 w-1/5 bg-[#F6E6C3]/20 rounded"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="h-3 w-8 bg-[#F6E6C3]/20 rounded"></div>
                  <div className="h-3 w-12 bg-[#F6E6C3]/20 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-[#F6E6C3]/20 rounded"></div>
                  <div className="h-8 w-16 bg-[#F6E6C3]/20 rounded"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
