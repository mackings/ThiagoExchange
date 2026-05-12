"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import type { Rate } from "@/shared/api";
import { money, usd } from "@/shared/api";

const enabledKey = "thiago.rateNotifications.enabled";
const notificationIntervalMs = 5 * 60 * 1000;

export function RateNotifier({ rates }: { rates: Rate[] }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const notificationRates = useMemo(
    () => rates.filter((rate) => ["BTC", "USDT", "ETH"].includes(rate.coin.toUpperCase())),
    [rates]
  );

  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
    setEnabled(localStorage.getItem(enabledKey) === "1" && Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (!enabled || permission !== "granted" || notificationRates.length === 0) {
      stopTimer();
      return;
    }
    stopTimer();
    timerRef.current = window.setInterval(() => {
      notifyNextRate(notificationRates, indexRef);
    }, notificationIntervalMs);
    return stopTimer;
  }, [enabled, permission, notificationRates]);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === "granted") {
      localStorage.setItem(enabledKey, "1");
      setEnabled(true);
      notifyNextRate(notificationRates, indexRef);
    }
  }

  function disableNotifications() {
    localStorage.removeItem(enabledKey);
    setEnabled(false);
    stopTimer();
  }

  function stopTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  if (!("Notification" in globalThis)) return null;

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
      <Chip
        icon={enabled ? <NotificationsActiveIcon /> : <NotificationsNoneIcon />}
        label={enabled ? "Rate alerts every 5 mins" : "Rate alerts off"}
        sx={{
          bgcolor: enabled ? "#eafff2" : "#f0efff",
          color: enabled ? "#0f7a40" : "#3035bf",
          fontWeight: 1000
        }}
      />
      {enabled ? (
        <Button variant="outlined" onClick={disableNotifications} sx={{ borderColor: "rgba(87,87,246,0.24)" }}>
          Disable alerts
        </Button>
      ) : (
        <Button variant="contained" onClick={enableNotifications} sx={{ bgcolor: "#5757f6" }}>
          Enable rate alerts
        </Button>
      )}
    </Stack>
  );
}

function notifyNextRate(rates: Rate[], indexRef: React.MutableRefObject<number>) {
  if (!rates.length || Notification.permission !== "granted") return;
  const rate = rates[indexRef.current % rates.length];
  indexRef.current += 1;

  new Notification(`${rate.coin} rate update`, {
    body: `${rate.network}: Thiago buys at ${money(rate.buyRateNgn)} per $1. Minimum ${usd(rate.minAmountUsd)}.`,
    icon: "/thiago-logo.svg",
    tag: `thiago-rate-${rate.coin}`
  });
}
