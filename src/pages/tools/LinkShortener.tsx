import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2 } from 'lucide-react';

export default function LinkShortener() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Link2 className="h-8 w-8" />
          Link Shortener
        </h1>
        <p className="text-muted-foreground mt-2">
          Create short, memorable links for easy sharing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shorten Your URL</CardTitle>
          <CardDescription>Enter a long URL to create a shortened version</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tool implementation coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
