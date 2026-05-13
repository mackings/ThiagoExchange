"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PersonIcon from "@mui/icons-material/Person";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import type { Rate, User } from "@/shared/api";
import { api, money, usd } from "@/shared/api";

const enabledKey = "thiago.rateNotifications.enabled";
const notificationIntervalMs = 5 * 60 * 1000;
const whatsappNumber = "2348137159066";

export function ProfileView({
  user,
  token,
  rates,
  onUser,
  onLogout,
  onError,
  onSuccess
}: {
  user?: User;
  token?: string;
  rates: Rate[];
  onUser: (user: User) => void;
  onLogout: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  useEffect(() => {
    if (!("Notification" in window)) return;
    setAlertsEnabled(localStorage.getItem(enabledKey) === "1" && Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (!alertsEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
    const id = window.setInterval(() => notifyRate(rates), notificationIntervalMs);
    return () => window.clearInterval(id);
  }, [alertsEnabled, rates]);

  async function toggleAlerts(checked: boolean) {
    if (!("Notification" in window)) {
      onError("Rate alerts are not supported on this device.");
      return;
    }
    if (!checked) {
      localStorage.removeItem(enabledKey);
      setAlertsEnabled(false);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      onError("Notification permission was not granted.");
      return;
    }
    localStorage.setItem(enabledKey, "1");
    setAlertsEnabled(true);
    notifyRate(rates);
  }

  async function saveProfile() {
    if (!token) {
      onError("Sign in to update your profile.");
      return;
    }
    setSaving(true);
    try {
      const payload = await api<{ user: User }>("/auth/me", { method: "PATCH", body: JSON.stringify({ name, phone }) }, token);
      onUser(payload.user);
      onSuccess("Profile updated.");
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <Alert severity="info" sx={{ borderRadius: 4 }}>Sign in to view your profile.</Alert>;
  }

  return (
    <Stack spacing={{ xs: 1.6, md: 2.5 }}>
      <Stack direction="row" spacing={1.4} alignItems="center">
        <Avatar sx={{ width: 54, height: 54, bgcolor: "#5757f6", fontWeight: 1000 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
        <Box>
          <Typography sx={{ fontWeight: 1000, fontSize: { xs: 22, md: 30 }, letterSpacing: "-0.035em" }}>Profile</Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: 13.5, md: 16 } }}>{user.email}</Typography>
        </Box>
      </Stack>

      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ borderRadius: { xs: 4, md: 5 }, borderColor: "rgba(87,87,246,0.14)" }}>
            <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
              <Stack spacing={1.5}>
                <Chip icon={<PersonIcon />} label="ACCOUNT DETAILS" sx={{ alignSelf: "flex-start", bgcolor: "#f0efff", color: "#3035bf", fontWeight: 1000, letterSpacing: 1.4 }} />
                <TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
                <TextField label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} fullWidth />
                <TextField label="Email" value={user.email} fullWidth disabled helperText="Email cannot be changed." />
                <Button variant="contained" onClick={saveProfile} disabled={saving} sx={{ bgcolor: "#5757f6", alignSelf: "flex-start" }}>
                  {saving ? "Saving..." : "Save profile"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Stack spacing={1.5}>
            <Card variant="outlined" sx={{ borderRadius: { xs: 4, md: 5 }, borderColor: "rgba(87,87,246,0.14)" }}>
              <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <NotificationsActiveIcon sx={{ color: "#5757f6" }} />
                      <Box>
                        <Typography sx={{ fontWeight: 1000 }}>Rate alerts</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 13 }}>Get periodic desk rate updates.</Typography>
                      </Box>
                    </Stack>
                    <Switch checked={alertsEnabled} onChange={(event) => toggleAlerts(event.target.checked)} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Button
              component="a"
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              variant="contained"
              startIcon={<WhatsAppIcon />}
              sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#0f9f70" } }}
            >
              Chat support on WhatsApp
            </Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={onLogout}>
              Log out
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

function notifyRate(rates: Rate[]) {
  if (!rates.length || !("Notification" in window) || Notification.permission !== "granted") return;
  const featured = rates.filter((rate) => ["BTC", "ETH", "USDT"].includes(rate.coin.toUpperCase()));
  const rate = (featured.length ? featured : rates)[Math.floor(Math.random() * (featured.length ? featured.length : rates.length))];
  new Notification(`${rate.coin} rate update`, {
    body: `${rate.network}: Thiago buys at ${money(rate.buyRateNgn)} per $1. Minimum ${usd(rate.minAmountUsd)}.`,
    icon: "/thiago-logo.svg",
    tag: `thiago-rate-${rate.coin}`
  });
}
