"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { AuthDialog, AuthMode, Session } from "@/features/auth/AuthDialog";
import { GiftCardsView } from "@/features/giftcards/GiftCardsView";
import { readSession, writeSession } from "@/shared/session";
import { PageFrame } from "@/shared/ui/PageFrame";

export default function GiftCardsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    setSession(saved);
    if (!saved) setAuthOpen(true);
  }, []);

  function saveSession(next: Session) {
    writeSession(next);
    setSession(next);
    setAuthOpen(false);
  }

  return (
    <PageFrame title="Gift cards">
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {!session ? (
          <Alert
            severity="info"
            action={<Button onClick={() => setAuthOpen(true)}>Sign in</Button>}
          >
            Sign in to submit gift cards for Prestmit verification.
          </Alert>
        ) : (
          <GiftCardsView token={session.token} onError={setError} />
        )}
      </Stack>
      <AuthDialog open={authOpen} mode={authMode} onMode={setAuthMode} onClose={() => setAuthOpen(false)} onSession={saveSession} onError={setError} />
    </PageFrame>
  );
}
