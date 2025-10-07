import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive, Files, Crown } from "lucide-react";

interface StorageStatsProps {
  totalStorage: number;
  storageLimit: number;
  fileCount: number;
  isPremium: boolean;
}

export function StorageStats({ totalStorage, storageLimit, fileCount, isPremium }: StorageStatsProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  };

  const usagePercentage = (totalStorage / storageLimit) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Storage Used</h3>
          </div>
          {isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatBytes(totalStorage)} of {formatBytes(storageLimit)}
            </span>
            <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Files className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Total Files</h3>
        </div>
        <p className="text-3xl font-bold">{fileCount}</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Plan</h3>
        </div>
        <p className="text-2xl font-bold">
          {isPremium ? "Premium" : "Free"}
        </p>
        {!isPremium && (
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade for 10GB storage
          </p>
        )}
      </Card>
    </div>
  );
}
