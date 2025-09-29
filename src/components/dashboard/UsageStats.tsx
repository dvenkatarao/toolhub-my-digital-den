import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Zap } from 'lucide-react';

export function UsageStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Tools Used This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">23 / 100</div>
          <Progress value={23} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">77 tools remaining</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Productivity Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">85%</div>
          <Progress value={85} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">+12% from last month</p>
        </CardContent>
      </Card>
    </div>
  );
}
