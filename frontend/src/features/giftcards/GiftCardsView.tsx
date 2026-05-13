"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { GiftCardAttachment, GiftCardConfig, GiftCardOrder, SellableGiftCard } from "@/shared/api";
import { api, money, usd } from "@/shared/api";

type Props = {
  token: string;
  onError: (message: string) => void;
};

export function GiftCardsView({ token, onError }: Props) {
  const [config, setConfig] = useState<GiftCardConfig | null>(null);
  const [orders, setOrders] = useState<GiftCardOrder[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("NAIRA");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [pin, setPin] = useState("");
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState<GiftCardAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    load();
  }, []);

  const giftCards = config?.sellableGiftcards || [];
  const selected = useMemo(() => giftCards.find((item) => String(item.id) === selectedId) || null, [giftCards, selectedId]);
  const availablePayouts = (config?.sellGiftcardPayoutMethods || []).filter((method) => method.available);
  const amountValue = Number(amount || 0);
  const estimated = selected ? amountValue * selected.rate : 0;
  const needsImage = selected?.form?.toLowerCase().includes("physical");
  const belowMinimum = Boolean(selected && amountValue > 0 && amountValue < selected.minimum);

  async function load() {
    setLoading(true);
    try {
      const [nextConfig, nextOrders] = await Promise.all([
        api<GiftCardConfig>("/giftcards/config", {}, token),
        api<GiftCardOrder[]>("/giftcards/orders", {}, token)
      ]);
      setConfig(nextConfig);
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      const firstPayout = nextConfig.sellGiftcardPayoutMethods?.find((method) => method.available)?.name;
      if (firstPayout) setPayoutMethod(firstPayout);
    } catch (err) {
      const message = (err as Error).message;
      setLocalError(message);
      onError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).slice(0, 6);
    const encoded = await Promise.all(picked.map(readFile));
    setAttachments((current) => [...current, ...encoded].slice(0, 6));
  }

  async function submit() {
    if (!selected) {
      setLocalError("Select the exact gift card type.");
      return;
    }
    if (!amountValue || amountValue < selected.minimum) {
      setLocalError(`Minimum amount for this card is ${usd(selected.minimum)}.`);
      return;
    }
    if (needsImage && attachments.length === 0) {
      setLocalError("Upload a clear front and back image for physical gift cards.");
      return;
    }
    setSubmitting(true);
    setLocalError("");
    setSuccess("");
    try {
      const order = await api<GiftCardOrder>(
        "/giftcards/orders",
        {
          method: "POST",
          body: JSON.stringify({
            giftcardId: selected.id,
            giftcardName: selected.name,
            categoryName: selected.category?.name || "",
            amount: amountValue,
            payoutMethod,
            payoutAddress,
            cardCode,
            pin,
            comments,
            attachments
          })
        },
        token
      );
      setOrders((items) => [order, ...items]);
      setSuccess(order.providerReference ? `Submitted to Prestmit. Reference: ${order.providerReference}` : "Gift card submission saved.");
      setAmount("");
      setCardCode("");
      setPin("");
      setComments("");
      setAttachments([]);
    } catch (err) {
      const message = (err as Error).message;
      setLocalError(message);
      onError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function refresh(order: GiftCardOrder) {
    try {
      const updated = await api<GiftCardOrder>(`/giftcards/orders/${order.id}/refresh`, { method: "POST" }, token);
      setOrders((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      onError((err as Error).message);
    }
  }

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={22} />
          <Typography>Loading Prestmit gift card options...</Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      {localError && <Alert severity="error" onClose={() => setLocalError("")}>{localError}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}
      {config && !config.configured && (
        <Alert severity="warning" icon={<WarningAmberIcon />}>
          Prestmit API keys are not configured on the server yet. Add the Render environment variables before live verification can run.
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start" sx={{ maxWidth: 1180, mx: "auto" }}>
        <Grid item xs={12} md={7}>
          <Card
            variant="outlined"
            sx={{
              width: "100%",
              borderRadius: { xs: 2.5, md: 3 },
              borderColor: "rgba(37,99,235,0.16)",
              boxShadow: "0 18px 44px rgba(37,99,235,0.10)",
              bgcolor: "#f8fbff"
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
              <Stack spacing={{ xs: 1.4, md: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ width: { xs: 38, md: 42 }, height: { xs: 38, md: 42 }, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#dbeafe", color: "#1d4ed8" }}>
                    <CreditCardIcon />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 1000, fontSize: { xs: 20, md: 28 }, color: "#08133b", lineHeight: 1.05 }}>
                      Sell gift cards
                    </Typography>
                    <Typography sx={{ color: "#60708c", fontSize: { xs: 13, md: 15 } }}>
                      Submit cards to Prestmit for validation and payout review.
                    </Typography>
                  </Box>
                </Stack>

                <FormControl fullWidth>
                  <InputLabel>Gift card type</InputLabel>
                  <Select label="Gift card type" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} sx={fieldSx}>
                    {giftCards.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)}>
                        {giftCardLabel(item)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selected && (
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fff", border: "1px solid rgba(37,99,235,0.12)" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>{selected.category?.name || selected.name}</Typography>
                        <Typography sx={{ color: "#60708c", fontSize: 13 }}>{selected.form} • {selected.country || "Global"}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label={`${money(selected.rate)} / $1`} sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 900 }} />
                        <Chip label={`Min ${usd(selected.minimum)}`} sx={{ bgcolor: "#eefcf4", color: "#10713e", fontWeight: 900 }} />
                      </Stack>
                    </Stack>
                  </Box>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: "100%" }}>
                  <TextField
                    label="Card value"
                    type="number"
                    fullWidth
                    value={amount}
                    error={belowMinimum}
                    helperText={selected ? `Minimum ${usd(selected.minimum)}` : "Enter total face value"}
                    onChange={(event) => setAmount(event.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    FormHelperTextProps={{ sx: { mx: 0, mt: 0.5 } }}
                    sx={fieldSx}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Payout method</InputLabel>
                    <Select label="Payout method" value={payoutMethod} onChange={(event) => setPayoutMethod(event.target.value)} sx={fieldSx}>
                      {(availablePayouts.length ? availablePayouts : [{ name: "NAIRA", available: true }]).map((method) => (
                        <MenuItem key={method.name} value={method.name}>{method.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                {["USDT", "BITCOINS", "BTC", "LTC", "DOGE"].includes(payoutMethod.toUpperCase()) && (
                  <TextField label="Payout wallet address" fullWidth value={payoutAddress} onChange={(event) => setPayoutAddress(event.target.value)} sx={fieldSx} />
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: "100%" }}>
                  <TextField label="Card code or claim code" fullWidth value={cardCode} onChange={(event) => setCardCode(event.target.value)} sx={fieldSx} />
                  <TextField label="PIN (optional)" fullWidth value={pin} onChange={(event) => setPin(event.target.value)} sx={fieldSx} />
                </Stack>

                <TextField
                  label="Notes for verifier"
                  multiline
                  minRows={3}
                  fullWidth
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                  placeholder="Receipt details, country, purchase source, or any other useful note"
                  sx={fieldSx}
                />

                <Box sx={{ p: { xs: 1.25, md: 1.5 }, borderRadius: 2, bgcolor: "#fff", border: "1px dashed rgba(37,99,235,0.26)" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>Upload card images</Typography>
                      <Typography sx={{ color: "#60708c", fontSize: 13 }}>JPG/PNG, clear code and receipt if available. Up to 6 images here.</Typography>
                    </Box>
                    <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ borderRadius: 999, minWidth: { xs: "100%", sm: 160 } }}>
                      Choose files
                      <input hidden type="file" accept="image/png,image/jpeg" multiple onChange={(event) => handleFiles(event.target.files)} />
                    </Button>
                  </Stack>
                  {attachments.length > 0 && (
                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 1.2 }}>
                      {attachments.map((file, index) => (
                        <Chip key={`${file.name}-${index}`} label={file.name} onDelete={() => setAttachments((items) => items.filter((_, idx) => idx !== index))} />
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box sx={{ p: { xs: 1.25, md: 1.5 }, borderRadius: 2, bgcolor: "#08133b", color: "#fff" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                    <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: { xs: 13.5, md: 16 } }}>Estimated Prestmit payout</Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: { xs: 22, md: 28 }, whiteSpace: "nowrap" }}>{money(estimated)}</Typography>
                  </Stack>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  disabled={submitting || !config?.configured}
                  onClick={submit}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                  sx={{ bgcolor: "#1d4ed8", borderRadius: 999, py: 1.25, px: 2, "&:hover": { bgcolor: "#1e40af" }, "& .MuiButton-startIcon": { mr: { xs: 0.5, sm: 1 } } }}
                >
                  {submitting ? "Submitting..." : "Submit for Prestmit verification"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={1.25} sx={{ width: "100%" }}>
            <Typography sx={{ fontWeight: 1000, color: "#08133b", fontSize: { xs: 22, md: 24 }, lineHeight: 1.1 }}>Recent submissions</Typography>
            {orders.length === 0 && (
              <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3, color: "#60708c", bgcolor: "#fff", width: "100%" }}>
                No gift card submissions yet.
              </Paper>
            )}
            {orders.map((order) => (
              <Card key={order.id} variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(37,99,235,0.14)" }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1.2}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography sx={{ fontWeight: 1000 }}>{order.categoryName || order.giftcardName}</Typography>
                        <Typography sx={{ color: "#60708c", fontSize: 13 }}>{usd(order.amount)} • {order.payoutMethod}</Typography>
                      </Box>
                      <StatusChip status={order.status} />
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography sx={{ color: "#60708c", fontSize: 13 }}>Reference</Typography>
                      <Typography sx={{ fontWeight: 800, wordBreak: "break-word" }}>{order.providerReference || "Awaiting Prestmit reference"}</Typography>
                    </Stack>
                    {order.providerMessage && <Alert severity={order.status === "rejected" || order.status === "failed" ? "error" : "info"}>{order.providerMessage}</Alert>}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ color: "#60708c", fontSize: 13 }}>{new Date(order.createdAt).toLocaleString()}</Typography>
                      <Button size="small" startIcon={<RefreshIcon />} onClick={() => refresh(order)}>Refresh</Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

function StatusChip({ status }: { status: GiftCardOrder["status"] }) {
  const completed = status === "completed";
  const failed = status === "rejected" || status === "failed";
  return (
    <Chip
      size="small"
      icon={completed ? <CheckCircleIcon /> : failed ? <WarningAmberIcon /> : undefined}
      label={status}
      sx={{
        textTransform: "capitalize",
        fontWeight: 1000,
        bgcolor: completed ? "#e9fbf1" : failed ? "#fff1f2" : "#eff6ff",
        color: completed ? "#10713e" : failed ? "#be123c" : "#1d4ed8"
      }}
    />
  );
}

function giftCardLabel(item: SellableGiftCard) {
  const category = item.category?.name || "Gift card";
  return `${category} - ${item.name} (${item.form || "card"}, ${item.country || "global"})`;
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: { xs: 56, md: 58 },
    borderRadius: 2,
    bgcolor: "#fff",
    alignItems: "center"
  },
  "& .MuiInputLabel-root": {
    color: "#60708c"
  },
  "& .MuiInputBase-input": {
    py: { xs: 1.35, md: 1.45 }
  }
};

function readFile(file: File): Promise<GiftCardAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, contentType: file.type, data: String(reader.result || "") });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
