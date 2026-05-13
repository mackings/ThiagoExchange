import type { User } from "@/shared/api";

export type AuthMode = "login" | "register";
export type Session = { token: string; user: User };
