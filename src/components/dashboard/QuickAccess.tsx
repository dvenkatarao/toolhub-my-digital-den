import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Link2, FileImage, Shield, Lock, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const baseTools = [
  { name: 'Link Shortener', icon: Link2, url: '/dashboard/link-shortener', color: 'text-blue-500' },
  { name: 'Image Compressor', icon: FileImage, url: '/dashboard/image-compressor', color: 'text-green-500' },
  { name: 'Encrypted Text', icon: Shield, url: '/dashboard/encrypted-text', color: 'text-orange-500' },
];

const premiumTools = [
  { name: 'Password Manager', icon: Lock, url: '/dashboard/password-manager', color: 'text-purple-500' },
  { name: 'Personal Cloud', icon: Cloud, url: '/dashboard/personal-cloud', color: 'text-cyan-500' },
];

export function QuickAccess() {
  const { isPremium } = useAuth();
  const tools = isPremium ? [...baseTools, ...premiumTools] : baseTools;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Favorite Tools
        </CardTitle>
        <CardDescription>Your most used productivity tools</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              to={tool.url}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <tool.icon className={cn('h-8 w-8', tool.color)} />
              <span className="text-sm font-medium text-center">{tool.name}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
