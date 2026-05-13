"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { ProfileView } from "@/features/profile/ProfileView";
import type { Session } from "@/features/auth/AuthDialog";
import type { Rate } from "@/shared/api";
import { api } from "@/shared/api";
import { clearSession, readSession, writeSession } from "@/shared/session";
import { PageFrame } from "@/shared/ui/PageFrame";

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setSession(readSession());
    loadRates();
  }, []);

  async function loadRates() {
    try {
      const payload = await api<Rate[]>("/rates");
      setRates(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function logout() {
    clearSession();
    window.location.href = "/";
  }

  return (
    <PageFrame title="Profile">
      <Stack spacing={1.5}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}
        <ProfileView
          user={session?.user}
          token={session?.token}
          rates={rates}
          onUser={(user) => {
            if (!session) return;
            const next = { ...session, user };
            writeSession(next);
            setSession(next);
          }}
          onLogout={logout}
          onError={setError}
          onSuccess={setSuccess}
        />
      </Stack>
    </PageFrame>
  );
}
