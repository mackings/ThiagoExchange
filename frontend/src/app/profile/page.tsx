"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { ProfileView } from "@/features/profile/ProfileView";
import type { Session } from "@/features/auth/types";
import type { Rate } from "@/shared/api";
import { api } from "@/shared/api";
import { clearSession, readSession, writeSession } from "@/shared/session";
import { PageFrame } from "@/shared/ui/PageFrame";

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    setSession(readSession());
    setCheckingSession(false);
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
        {checkingSession ? (
          <ProfileSkeleton />
        ) : (
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
        )}
      </Stack>
    </PageFrame>
  );
}

function ProfileSkeleton() {
  return (
    <Stack spacing={{ xs: 1.6, md: 2.5 }}>
      <Stack direction="row" spacing={1.4} alignItems="center">
        <Skeleton variant="circular" width={54} height={54} />
        <Stack>
          <Skeleton variant="text" width={140} height={34} />
          <Skeleton variant="text" width={220} />
        </Stack>
      </Stack>
      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        <Grid item xs={12} md={7}>
          <Skeleton variant="rounded" height={340} sx={{ borderRadius: { xs: 4, md: 5 } }} />
        </Grid>
        <Grid item xs={12} md={5}>
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={110} sx={{ borderRadius: { xs: 4, md: 5 } }} />
            <Skeleton variant="rounded" height={44} sx={{ borderRadius: 999 }} />
            <Skeleton variant="rounded" height={44} sx={{ borderRadius: 999 }} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
