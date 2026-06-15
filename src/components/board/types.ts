export type JobItem = {
  id: string;
  title: string;
  platforms: string[];
  contentType: string;
  payerName?: string | null;
  status: string;
  receivedDate?: string | null;
  reviewDeadline?: string | null;
  publishDate?: string | null;
  paymentDate?: string | null;
  grossAmount?: number | null;
  netAmount?: number | null;
  hasBrief?: boolean;
};

export type JobsByStatus = Record<string, JobItem[]>;
