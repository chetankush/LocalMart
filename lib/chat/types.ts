/** Chat between a buyer and a shop — what the pages get from the API */

export type ChatSide = "BUYER" | "SHOP";

export interface ChatSummary {
  id: string;
  side: ChatSide;
  shop: { id: string; name: string; logo: string | null; handle: string | null };
  buyer: { id: string; name: string };
  productId: string | null;
  lastMessageAt: string;
  lastMessageText: string | null;
  lastFromMe: boolean;
  unread: number;
  /** When the other side last read it (✓✓ seen) */
  otherReadAt: string | null;
  blocked: boolean;
}

export interface ChatMessage {
  id: string;
  clientId: string | null;
  senderRole: "BUYER" | "SHOP" | "LOCALMART";
  mine: boolean;
  kind: "TEXT" | "PRODUCT" | "ORDER_LINK" | "SYSTEM";
  body: string | null;
  product: { id: string; name: string; price: number; image: string | null; available: boolean } | null;
  orderLink: { code: string; mode: "ORDER" | "CHOOSE"; forName: string | null } | null;
  createdAt: string;
  /** Only on this page: still sending, or failed */
  pending?: "sending" | "failed";
}

export interface ChatOpen {
  conversation: ChatSummary;
  about: { id: string; name: string; price: number; image: string | null } | null;
  messages: ChatMessage[];
  hasMore: boolean;
}

export type ChatStreamEvent =
  | { type: "message"; conversationId: string; message: ChatMessage; conversation: ChatSummary }
  | { type: "read"; conversationId: string; by: ChatSide; at: string }
  | { type: "reconnected" };
