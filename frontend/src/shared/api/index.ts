export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  verified: boolean;
  role: "user" | "admin";
};

export type Rate = {
  id: string;
  coin: string;
  network: string;
  buyRateNgn: number;
  walletAddress: string;
  minAmountUsd: number;
  active: boolean;
  updatedAt: string;
};

export type Trade = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  coin: string;
  network: string;
  amountUsd: number;
  rateNgn: number;
  expectedNgn: number;
  walletAddress: string;
  paymentBank: string;
  accountName: string;
  accountNumber: string;
  transactionHash: string;
  status: "pending" | "confirmed" | "paid" | "cancelled";
  messages: TradeMessage[];
  receiptNote: string;
  createdAt: string;
  expiresAt: string;
  confirmedAt?: string;
  paidAt?: string;
};

export type TradeMessage = {
  id: string;
  sender: "system" | "user" | "admin";
  body: string;
  attachmentUrl?: string;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export function wsUrl(path: string, token: string) {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value || 0);
}
