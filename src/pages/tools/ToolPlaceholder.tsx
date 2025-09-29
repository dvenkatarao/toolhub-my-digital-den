import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ToolPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function ToolPlaceholder({ title, description, icon: Icon }: ToolPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Icon className="h-8 w-8" />
          {title}
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tool implementation coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
