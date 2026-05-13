"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import type { Session } from "@/features/auth/types";
import { GiftCardsView } from "@/features/giftcards/GiftCardsView";
import { readSession } from "@/shared/session";
import { PageFrame } from "@/shared/ui/PageFrame";

export default function GiftCardsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.replace("/login?next=/giftcards");
      return;
    }
    setSession(saved);
  }, []);

  return (
    <PageFrame title="Gift cards">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {!session ? <Alert severity="info">Redirecting to sign in...</Alert> : <GiftCardsView token={session.token} onError={setError} />}
      </Stack>
    </PageFrame>
  );
}
