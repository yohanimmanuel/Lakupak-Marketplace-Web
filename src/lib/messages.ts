export type MessageConversation = {
  distributorId: number;
  name: string;
  phone: string | null;
  logoUrl: string | null;
  lastProductId?: string | null;
  lastProductName?: string | null;
  lastOpenedAt: number;
};

const STORAGE_KEY = "laku-mp-messages";

type StoreShape = {
  conversationsByUserId: Record<string, MessageConversation[]>;
};

function readStore(): StoreShape {
  if (typeof window === "undefined") return { conversationsByUserId: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversationsByUserId: {} };
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      conversationsByUserId: parsed.conversationsByUserId ?? {},
    };
  } catch {
    return { conversationsByUserId: {} };
  }
}

function writeStore(store: StoreShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listConversations(userId: number): MessageConversation[] {
  const list = readStore().conversationsByUserId[String(userId)] ?? [];
  return [...list].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export function upsertConversation(
  userId: number,
  conversation: Omit<MessageConversation, "lastOpenedAt"> & {
    lastOpenedAt?: number;
  },
): MessageConversation[] {
  const store = readStore();
  const key = String(userId);
  const existing = store.conversationsByUserId[key] ?? [];
  const nextItem: MessageConversation = {
    distributorId: conversation.distributorId,
    name: conversation.name,
    phone: conversation.phone,
    logoUrl: conversation.logoUrl,
    lastProductId: conversation.lastProductId ?? null,
    lastProductName: conversation.lastProductName ?? null,
    lastOpenedAt: conversation.lastOpenedAt ?? Date.now(),
  };
  const without = existing.filter(
    (item) => item.distributorId !== nextItem.distributorId,
  );
  store.conversationsByUserId[key] = [nextItem, ...without];
  writeStore(store);
  return listConversations(userId);
}
