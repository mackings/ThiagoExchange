"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import type { User } from "@/shared/api";
import { api } from "@/shared/api";

export type AuthMode = "login" | "register";
export type Session = { token: string; user: User };

export function AuthDialog({
  open,
  mode,
  onMode,
  onClose,
  onSession,
  onError
}: {
  open: boolean;
  mode: AuthMode;
  onMode: (mode: AuthMode) => void;
  onClose: () => void;
  onSession: (session: Session) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    try {
      const payload = await api<Session>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(mode === "register" ? { name, email, phone, password } : { email, password })
      });
      onSession(payload);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4, background: "linear-gradient(180deg, #fff, #fff7ef)" } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack alignItems="center" spacing={1}>
          <Image src="/thiago-logo.svg" alt="Thiago Exchange" width={190} height={52} />
          <Typography variant="h6" sx={{ fontWeight: 1000 }}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {mode === "register" && (
            <>
              <TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
              <TextField label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} fullWidth />
            </>
          )}
          <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
          <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} fullWidth />
          <Button variant="contained" size="large" startIcon={<AccountBalanceIcon />} onClick={submit}>
            {mode === "login" ? "Sign in" : "Verify and Continue"}
          </Button>
          <Button onClick={() => onMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Create a new account" : "I already have an account"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
