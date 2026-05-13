"use client";

import { useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BadgeIcon from "@mui/icons-material/Badge";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
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
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const payload = await api<Session>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(mode === "register" ? { name, email, phone, password } : { email, password })
      });
      onSession(payload);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: 430 },
          maxHeight: { xs: "calc(100% - 18px)", sm: "calc(100% - 64px)" },
          alignSelf: { xs: "flex-end", sm: "center" },
          borderRadius: { xs: "28px 28px 0 0", sm: 4 },
          overflow: "hidden",
          border: "1px solid rgba(37,99,235,0.14)",
          bgcolor: "#f8fbff",
          boxShadow: "0 28px 70px rgba(8,19,59,0.22)"
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: { xs: 2, sm: 2.6 }, pt: { xs: 1.5, sm: 2 }, pb: 2, bgcolor: "#fff", borderBottom: "1px solid rgba(37,99,235,0.10)" }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Image src="/thiago-logo.svg" alt="Thiago Exchange" width={144} height={40} priority />
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={onClose} aria-label="close authentication" sx={{ color: "#60708c" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={0.6} sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 1000, color: "#08133b", fontSize: { xs: 25, sm: 30 }, lineHeight: 1, letterSpacing: 0 }}>
              {mode === "login" ? "Welcome back" : "Create your account"}
            </Typography>
            <Typography sx={{ color: "#60708c", fontSize: { xs: 13.5, sm: 14.5 }, lineHeight: 1.55 }}>
              {mode === "login" ? "Sign in to continue trading, chatting, and checking your orders." : "Set up your profile to start secure trades and gift card submissions."}
            </Typography>
          </Stack>
        </Box>

        <Stack spacing={2} sx={{ p: { xs: 2, sm: 2.6 } }}>
          <Stack direction="row" sx={{ p: 0.5, borderRadius: 999, bgcolor: "#eaf2ff", border: "1px solid rgba(37,99,235,0.10)" }}>
            {(["login", "register"] as AuthMode[]).map((item) => (
              <Button
                key={item}
                fullWidth
                onClick={() => onMode(item)}
                sx={{
                  minHeight: 40,
                  color: mode === item ? "#08133b" : "#60708c",
                  bgcolor: mode === item ? "#fff" : "transparent",
                  boxShadow: mode === item ? "0 8px 20px rgba(37,99,235,0.10)" : "none",
                  "&:hover": { bgcolor: mode === item ? "#fff" : "rgba(255,255,255,0.56)" }
                }}
              >
                {item === "login" ? "Sign in" : "Register"}
              </Button>
            ))}
          </Stack>

          {mode === "register" && (
            <>
              <TextField
                label="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" /></InputAdornment> }}
              />
              <TextField
                label="Phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }}
              />
            </>
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><AlternateEmailIcon fontSize="small" /></InputAdornment> }}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" aria-label={showPassword ? "hide password" : "show password"} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            disabled={submitting}
            onClick={submit}
            sx={{
              minHeight: 50,
              bgcolor: "#1d4ed8",
              "&:hover": { bgcolor: "#1e40af" },
              "&.Mui-disabled": { bgcolor: "#93b7f8", color: "#fff" }
            }}
          >
            {submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          <Divider sx={{ borderColor: "rgba(37,99,235,0.10)" }} />

          <Typography sx={{ color: "#60708c", textAlign: "center", fontSize: 13 }}>
            {mode === "login" ? "New here?" : "Already registered?"}{" "}
            <Button
              onClick={() => onMode(mode === "login" ? "register" : "login")}
              sx={{ minHeight: "auto", p: 0, verticalAlign: "baseline", color: "#1d4ed8", fontWeight: 1000 }}
            >
              {mode === "login" ? "Create an account" : "Sign in instead"}
            </Button>
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
