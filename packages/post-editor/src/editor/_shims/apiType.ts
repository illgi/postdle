// Shim of pagedle's @/request/apiType — only TFormRes used by the editor subtree.
export type TFormRes = {
  id: string;
  memberId: number;
  pageId?: string;
  title: string;
  description?: string;
  questions: string; // JSON string of TFormQuestion[]
  isAnonymous: boolean;
  allowMultipleSubmissions: boolean;
  expiresAt?: string;
  isActive: boolean;
  notifyEmail?: string;
  submissionCount: number;
  createTime: string;
  updateTime: string;
};
