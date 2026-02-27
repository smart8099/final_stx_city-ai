export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  department?: string;
  confidence?: number;
  sources?: { file: string; page?: number }[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  sessionId: string;
  status: "new" | "open" | "resolved" | "escalated";
  department?: string;
  intent?: string;
  messages: Message[];
  startedAt: string;
  updatedAt: string;
}

export const DEPARTMENTS = [
  "Public Works",
  "Building Services",
  "Parks & Recreation",
  "Code Enforcement",
  "Utilities",
  "City Clerk",
] as const;

export const INTENT_LABELS: Record<string, string> = {
  information_request: "Info Request",
  process_guidance: "Process Guidance",
  complaint_report: "Complaint",
  emergency: "Emergency",
  out_of_scope: "Out of Scope",
};

export type Department = (typeof DEPARTMENTS)[number];
