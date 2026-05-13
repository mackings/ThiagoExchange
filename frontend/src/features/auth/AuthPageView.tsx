"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BadgeIcon from "@mui/icons-material/Badge";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";
import ShieldIcon from "@mui/icons-material/Shield";
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
    <Box sx={{ minHeight: "100vh", px: { xs: 0.75, md: 2 }, py: { xs: 0.75, md: 2 }, display: "flex", alignItems: { xs: "stretch", md: "center" } }}>
      <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center" }}>
        <Grid container spacing={{ xs: 1.5, md: 4 }} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Stack
              spacing={{ xs: 2, md: 3 }}
              sx={{
                height: "100%",
                minHeight: { xs: 210, md: 620 },
                justifyContent: "space-between",
                p: { xs: 1.5, md: 3 },
                borderRadius: { xs: 3, md: 4 },
                bgcolor: "#08133b",
                color: "#fff",
                overflow: "hidden",
                position: "relative"
              }}
            >
              <Stack spacing={2}>
                <Button href={isLogin ? "/login" : "/register"} sx={{ alignSelf: "flex-start", p: 0, minHeight: "auto" }}>
                  <Image src="/thiago-logo.svg" alt="Thiago Exchange" width={158} height={44} priority />
                </Button>
                <Chip
                  icon={<ShieldIcon />}
                  label="SECURE EXCHANGE ACCESS"
                  sx={{ alignSelf: "flex-start", bgcolor: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 1000, letterSpacing: 1.3, "& .MuiChip-icon": { color: "#93c5fd" } }}
                />
                <Box>
                  <Typography sx={{ fontWeight: 1000, fontSize: { xs: 30, md: 54 }, lineHeight: 0.98, letterSpacing: 0 }}>
                    {isLogin ? "Continue your trade desk session." : "Start trading with a secured desk."}
                  </Typography>
                  <Typography sx={{ mt: 1.4, color: "rgba(255,255,255,0.72)", fontSize: { xs: 14, md: 16 }, lineHeight: 1.6, maxWidth: 430 }}>
                    Access offers, active trading grounds, WhatsApp-style chat, and gift card submissions from one profile.
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={1}>
                {[
                  ["30 min", "escrow window"],
                  ["Live", "desk chat"],
                  ["API", "gift card review"]
                ].map(([value, label]) => (
                  <Grid item xs={4} key={label}>
                    <Paper sx={{ p: { xs: 1, md: 1.25 }, borderRadius: 2, bgcolor: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.10)" }}>
                      <Typography sx={{ fontWeight: 1000, fontSize: { xs: 16, md: 20 } }}>{value}</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.64)", fontSize: { xs: 10.5, md: 12 } }}>{label}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card
              sx={{
                minHeight: "100%",
                borderRadius: { xs: 3, md: 4 },
                border: "1px solid rgba(37,99,235,0.14)",
                boxShadow: "0 24px 62px rgba(37,99,235,0.14)",
                bgcolor: "#f8fbff"
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3, md: 5 } }}>
                <Stack spacing={{ xs: 2, md: 2.6 }}>
                  <Box>
                    <Typography sx={{ color: "#08133b", fontWeight: 1000, fontSize: { xs: 28, md: 40 }, lineHeight: 1, letterSpacing: 0 }}>
                      {isLogin ? "Sign in" : "Create account"}
                    </Typography>
                    <Typography sx={{ mt: 1, color: "#60708c", fontSize: { xs: 14, md: 16 }, lineHeight: 1.6 }}>
                      {isLogin ? "Enter your details to open your dashboard." : "Create your profile and continue to the app."}
                    </Typography>
                  </Box>

                  {error && (
                    <Paper sx={{ p: 1.4, borderRadius: 2, bgcolor: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 13.5 }}>{error}</Typography>
                    </Paper>
                  )}

                  {mode === "register" && (
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" /></InputAdornment> }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }} />
                      </Grid>
                    </Grid>
                  )}

                  <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><AlternateEmailIcon fontSize="small" /></InputAdornment> }} />
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
                    disabled={submitting}
                    onClick={submit}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ minHeight: 52, bgcolor: "#1d4ed8", "&:hover": { bgcolor: "#1e40af" }, "&.Mui-disabled": { bgcolor: "#93b7f8", color: "#fff" } }}
                  >
                    {submitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
                  </Button>

                  <Typography sx={{ color: "#60708c", textAlign: "center", fontSize: 13.5 }}>
                    {isLogin ? "New to Thiago Exchange?" : "Already have an account?"}{" "}
                    <Button href={switchHref} sx={{ minHeight: "auto", p: 0, verticalAlign: "baseline", color: "#1d4ed8", fontWeight: 1000 }}>
                      {isLogin ? "Create an account" : "Sign in"}
                    </Button>
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
