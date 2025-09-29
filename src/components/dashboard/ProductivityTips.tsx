import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const tips = [
  'Use the Link Shortener to track your marketing campaign performance',
  'QR codes can increase engagement by up to 40% in physical materials',
  'Regular image compression can save 60% of storage space',
  'Enable 2FA in your Password Manager for extra security',
];

export function ProductivityTips() {
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Productivity Tip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{randomTip}</p>
      </CardContent>
    </Card>
  );
}
