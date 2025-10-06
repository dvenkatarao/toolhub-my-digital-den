export type SubscriptionItem = {
  id: string;
  vendor: string;
  amount?: number;
  currency?: string;
  nextChargeDate?: string;
  status: 'active' | 'trial';
  rawSubject?: string;
};

export type WorkerRequest = {
  files: File[];
};

export type WorkerResponse = {
  subscriptions: SubscriptionItem[];
};
