import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, Calendar, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionItem } from '@/workers/renewal-radar.worker';

const RenewalRadar = () => {
  const [processLocally, setProcessLocally] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { toast } = useToast();

  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/renewal-radar.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e: MessageEvent) => {
        const { subscriptions: newSubs } = e.data;
        setSubscriptions(prev => {
          const combined = [...prev, ...newSubs];
          const unique = Array.from(
            new Map(combined.map(item => [item.id, item])).values()
          );
          return unique;
        });
        setIsProcessing(false);
        toast({
          title: 'Processing complete',
          description: `Found ${newSubs.length} subscription(s)`,
        });
      };
    }
    return workerRef.current;
  }, [toast]);

  const handleFiles = useCallback((files: FileList) => {
    const emlFiles = Array.from(files).filter(file => 
      file.name.endsWith('.eml') || file.type === 'message/rfc822'
    );

    if (emlFiles.length === 0) {
      toast({
        title: 'Invalid files',
        description: 'Please select .eml email files',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    const worker = initWorker();
    worker.postMessage({ files: emlFiles });
  }, [initWorker, toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const downloadICS = (subscription: SubscriptionItem) => {
    if (!subscription.nextChargeDate) {
      toast({
        title: 'No date available',
        description: 'This subscription does not have a renewal date',
        variant: 'destructive',
      });
      return;
    }

    const date = new Date(subscription.nextChargeDate);
    const startDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Renewal Radar//EN',
      'BEGIN:VEVENT',
      `UID:${subscription.id}@renewalradar.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDate}`,
      `SUMMARY:${subscription.vendor} Subscription Renewal`,
      `DESCRIPTION:Your ${subscription.vendor} subscription will renew${subscription.amount ? ` for ${subscription.currency}${subscription.amount}` : ''}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Subscription renewal reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${subscription.vendor}-renewal.ics`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Calendar reminder created',
      description: 'Download started',
    });
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Renewal Radar</h1>
          <p className="text-muted-foreground mt-2">
            Find and manage your subscriptions without compromising your privacy
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="process-locally"
            checked={processLocally}
            onCheckedChange={setProcessLocally}
            disabled
          />
          <Label htmlFor="process-locally">Process locally</Label>
        </div>
      </div>

      <Card
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-medium text-foreground">
              Drag and drop your email files (.eml) here
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              All processing happens securely in your browser and your files are never uploaded
            </p>
          </div>
          <Button variant="secondary" type="button">
            Browse Files
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".eml,message/rfc822"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </Card>

      {isProcessing && (
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <p className="text-foreground">Processing emails locally...</p>
          </div>
        </Card>
      )}

      {subscriptions.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Detected Subscriptions ({subscriptions.length})
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Next Charge Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.vendor}</TableCell>
                  <TableCell>
                    <Badge variant={sub.status === 'trial' ? 'secondary' : 'default'}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatAmount(sub.amount, sub.currency)}</TableCell>
                  <TableCell>{formatDate(sub.nextChargeDate)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Get Cancellation Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadICS(sub)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Add Reminder to Calendar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default RenewalRadar;
