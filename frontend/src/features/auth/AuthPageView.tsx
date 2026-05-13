"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import type { AuthMode, Session } from "@/features/auth/types";
import { api } from "@/shared/api";
import { writeSession } from "@/shared/session";

export function AuthPageView({ mode }: { mode: AuthMode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next?.startsWith("/")) setNextPath(next);
  }, []);

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const payload = await api<Session>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(mode === "register" ? { name, email, phone, password } : { email, password })
      });
      writeSession(payload);
      window.location.href = nextPath;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isLogin = mode === "login";
  const switchHref = `${isLogin ? "/register" : "/login"}?next=${encodeURIComponent(nextPath)}`;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6fb", px: { xs: 2, sm: 3 }, py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm" disableGutters>
        <Stack spacing={{ xs: 4, md: 5 }}>
          <Button href={isLogin ? "/login" : "/register"} sx={{ alignSelf: "flex-start", p: 0, minHeight: "auto" }}>
            <Image src="/thiago-logo.svg" alt="Thiago Exchange" width={172} height={48} priority />
          </Button>

          <Box>
            <Typography sx={{ color: "#081f5c", fontWeight: 1000, fontSize: { xs: 38, sm: 46 }, lineHeight: 1.02, letterSpacing: 0 }}>
              {isLogin ? "Welcome Back," : "Create Account,"}
            </Typography>
            <Typography sx={{ mt: 1.2, color: "#697697", fontWeight: 800, fontSize: { xs: 20, sm: 23 }, lineHeight: 1.35 }}>
              {isLogin ? "Kindly enter your details to log in." : "Kindly enter your details to get started."}
            </Typography>
          </Box>

          <Stack spacing={{ xs: 2.5, md: 3 }}>
            {error && (
              <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", boxShadow: "none" }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{error}</Typography>
              </Paper>
            )}

            {mode === "register" && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <AuthField label="Full Name" placeholder="Your full name" value={name} onChange={setName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <AuthField label="Phone Number" placeholder="+234..." value={phone} onChange={setPhone} />
                </Grid>
              </Grid>
            )}

            <AuthField label="Email Address" placeholder="example@gmail.com" value={email} onChange={setEmail} type="email" />
            <AuthField
              label="Password"
              placeholder="********"
              value={password}
              onChange={setPassword}
              type={showPassword ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton edge="end" aria-label={showPassword ? "hide password" : "show password"} onClick={() => setShowPassword((value) => !value)} sx={{ color: "#697697" }}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              }
            />

            {isLogin && (
              <Button href="#" sx={{ alignSelf: "flex-start", minHeight: "auto", p: 0, borderRadius: 0, color: "#2f6df6", borderBottom: "1px solid #2f6df6", fontSize: 18, fontWeight: 900 }}>
                Forgot Password
              </Button>
            )}

            <Button
              variant="contained"
              size="large"
              disabled={submitting}
              onClick={submit}
              sx={{
                mt: { xs: 1, md: 1.5 },
                minHeight: 60,
                borderRadius: 2,
                bgcolor: "#2f6df6",
                color: "#fff",
                fontSize: 18,
                fontWeight: 1000,
                "&:hover": { bgcolor: "#1e55d8" },
                "&.Mui-disabled": { bgcolor: "#b7bac5", color: "#fff" }
              }}
            >
              {submitting ? "Please wait..." : isLogin ? "Login" : "Create Account"}
            </Button>

            <Typography sx={{ color: "#081f5c", textAlign: "center", fontSize: { xs: 16, sm: 18 }, fontWeight: 900 }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <Button href={switchHref} sx={{ minHeight: "auto", p: 0, verticalAlign: "baseline", color: "#2f6df6", fontSize: "inherit", fontWeight: 1000 }}>
                {isLogin ? "Create Account" : "Login"}
              </Button>
            </Typography>
          </Stack>

          <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "#fff", boxShadow: "none" }}>
            <Typography sx={{ color: "#697697", fontWeight: 1000, fontSize: 15 }}>
              SECURE ACCESS
            </Typography>
            <Grid container spacing={1.2} sx={{ mt: 0.5 }}>
              {["Live desk offers", "Gift card review", "Trade history"].map((item) => (
                <Grid item xs={12} sm={4} key={item}>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#f4f6fb", color: "#081f5c", fontWeight: 900, textAlign: "center", fontSize: 13 }}>
                    {item}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

function AuthField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  endAdornment
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  endAdornment?: ReactNode;
}) {
  return (
    <Stack spacing={1}>
      <Typography sx={{ color: "#697697", fontWeight: 900, fontSize: { xs: 15, sm: 16 } }}>{label}</Typography>
      <TextField
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
        InputProps={{ endAdornment }}
        sx={{
          "& .MuiOutlinedInput-root": {
            minHeight: 64,
            bgcolor: "#fff",
            borderRadius: 1,
            fontSize: { xs: 18, sm: 20 },
            color: "#081f5c",
            "& fieldset": { borderColor: "transparent" },
            "&:hover fieldset": { borderColor: "transparent" },
            "&.Mui-focused": {
              bgcolor: "#eef3ff"
            },
            "&.Mui-focused fieldset": { borderColor: "#2f6df6", borderWidth: 2 }
          },
          "& .MuiInputBase-input": {
            px: 2,
            py: 1.65,
            "&::placeholder": { color: "#8c98b2", opacity: 1, fontWeight: 800 }
          }
        }}
      />
    </Stack>
  );
}
