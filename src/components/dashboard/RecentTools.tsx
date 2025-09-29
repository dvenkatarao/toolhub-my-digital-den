import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, QrCode, FileImage, Calculator, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const recentTools = [
  { name: 'Link Shortener', icon: Link2, url: '/dashboard/link-shortener', lastUsed: '2 hours ago' },
  { name: 'QR Generator', icon: QrCode, url: '/dashboard/qr-generator', lastUsed: '5 hours ago' },
  { name: 'Image Compressor', icon: FileImage, url: '/dashboard/image-compressor', lastUsed: 'Yesterday' },
  { name: 'Mortgage Calculator', icon: Calculator, url: '/dashboard/mortgage-calculator', lastUsed: '3 days ago' },
];

export function RecentTools() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Tools
        </CardTitle>
        <CardDescription>Quick access to your recently used tools</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {recentTools.map((tool) => (
          <Button
            key={tool.name}
            variant="outline"
            className="justify-start h-auto py-3"
            asChild
          >
            <Link to={tool.url}>
              <div className="flex items-center gap-3 w-full">
                <tool.icon className="h-5 w-5 shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.lastUsed}</p>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
