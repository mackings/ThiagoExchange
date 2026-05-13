"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
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
    setSession(saved);
  }, []);

  return (
    <PageFrame title="Gift cards">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {!session ? (
          <Alert
            severity="info"
            action={<Button href="/login?next=/giftcards">Sign in</Button>}
          >
            Sign in to submit gift cards for Prestmit verification.
          </Alert>
        ) : (
          <GiftCardsView token={session.token} onError={setError} />
        )}
      </Stack>
    </PageFrame>
  );
}
