import { RecentTools } from '@/components/dashboard/RecentTools';
import { UsageStats } from '@/components/dashboard/UsageStats';
import { QuickAccess } from '@/components/dashboard/QuickAccess';
import { ProductivityTips } from '@/components/dashboard/ProductivityTips';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.user_metadata?.display_name || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your personal productivity overview
        </p>
      </div>

      <UsageStats />

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccess />
        <RecentTools />
      </div>

      <ProductivityTips />
    </div>
  );
}
