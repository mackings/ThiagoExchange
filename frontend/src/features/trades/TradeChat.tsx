"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CancelIcon from "@mui/icons-material/Cancel";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SendIcon from "@mui/icons-material/Send";
import TagIcon from "@mui/icons-material/Tag";
import VerifiedIcon from "@mui/icons-material/Verified";
import WalletIcon from "@mui/icons-material/Wallet";
import type { Trade } from "@/shared/api";
import { api, money, usd, wsUrl } from "@/shared/api";
import { StatusChip } from "@/shared/ui/StatusChip";
import { TradeTimer } from "@/shared/ui/TradeTimer";

export function TradeChat({
  trade,
  token,
  onTrade,
  onRefresh,
  onError,
  compact = false,
  viewerRole = "user"
}: {
  trade: Trade;
  token?: string;
  onTrade: (trade: Trade) => void;
  onRefresh: () => void;
  onError: (message: string) => void;
  compact?: boolean;
  viewerRole?: "user" | "admin";
}) {
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState(trade.transactionHash || "");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [connected, setConnected] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const onTradeRef = useRef(onTrade);
  const onErrorRef = useRef(onError);
  const messages = useMemo(() => (Array.isArray(trade.messages) ? trade.messages : []), [trade.messages]);
  const hasReleasedCoin = Boolean(trade.transactionHash);

  useEffect(() => {
    onTradeRef.current = onTrade;
    onErrorRef.current = onError;
  }, [onTrade, onError]);

  useEffect(() => {
    if (!token) return;
    const socket = new WebSocket(wsUrl(`/trades/${trade.id}/ws`, token));
    socketRef.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => {
      setConnected(false);
      if (socketRef.current === socket) socketRef.current = null;
    };
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "trade" && payload.trade) {
          onTradeRef.current(payload.trade);
        }
        if (payload.type === "error" && payload.error) {
          onErrorRef.current(payload.error);
        }
      } catch {
        onErrorRef.current("Could not read chat update.");
      }
    };
    return () => socket.close();
  }, [trade.id, token]);

  function formatMessageTime(value: string) {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric"
    }).format(new Date(value));
  }

  async function postMessage() {
    if (!token || !message.trim()) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "message", body: message, attachmentUrl }));
      setMessage("");
      setAttachmentUrl("");
      setAttachmentName("");
      return;
    }
    try {
      const updated = await api<Trade>(
        `/trades/${trade.id}/messages`,
        { method: "POST", body: JSON.stringify({ body: message, attachmentUrl }) },
        token
      );
      setMessage("");
      setAttachmentUrl("");
      setAttachmentName("");
      onTrade(updated);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  function attachFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentUrl(String(reader.result || ""));
      setAttachmentName(file.name);
      if (!message.trim()) {
        setMessage("Proof screenshot attached.");
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveHash() {
    if (!token || !hash.trim()) return;
    try {
      const updated = await api<Trade>(
        `/trades/${trade.id}/hash`,
        { method: "PATCH", body: JSON.stringify({ transactionHash: hash }) },
        token
      );
      onTrade(updated);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  async function cancelTrade() {
    if (!token) return;
    setCanceling(true);
    try {
      const updated = await api<Trade>(`/trades/${trade.id}/cancel`, { method: "PATCH" }, token);
      onTrade(updated);
      setCancelOpen(false);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setCanceling(false);
    }
  }

  return (
    <Stack
      spacing={{ xs: 1, md: 1.5 }}
      sx={{
        minHeight: compact ? "auto" : { xs: "calc(100vh - 156px)", md: "calc(100vh - 190px)" }
      }}
    >
      <Box
        sx={{
          p: { xs: 1.25, md: 2 },
          pl: { xs: 1.6, md: 2.4 },
          color: "#08133b",
          borderRadius: { xs: 2.5, md: 3.5 },
          bgcolor: "#fff",
          border: "1px solid rgba(8,19,59,0.10)",
          boxShadow: "0 14px 36px rgba(8,19,59,0.09)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: "\"\"",
            position: "absolute",
            inset: "0 auto 0 0",
            width: 6,
            bgcolor: trade.status === "confirmed" ? "#0f7a62" : trade.status === "pending" ? "#d49416" : "#64708a"
          }
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={{ xs: 1.1, md: 2 }}>
          <Stack spacing={0.9}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ bgcolor: "#08133b", color: "#fff", fontWeight: 1000, width: { xs: 36, md: 46 }, height: { xs: 36, md: 46 }, boxShadow: "0 8px 18px rgba(8,19,59,0.14)" }}>
                {trade.coin.slice(0, 1)}
              </Avatar>
              <Box>
                <Typography variant={compact ? "subtitle1" : "h6"} sx={{ fontWeight: 1000, fontSize: { xs: 16, md: compact ? 16 : 20 } }}>
                  {trade.coin} trade thread
                </Typography>
                <Typography variant="body2" sx={{ color: "#64708a", fontSize: { xs: 13, md: 14 } }}>
                  {usd(trade.amountUsd)} on {trade.network}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap sx={{ "& .MuiChip-root": { height: { xs: 24, md: 28 } }, "& .MuiChip-label": { px: { xs: 0.8, md: 1 }, fontSize: { xs: 11.5, md: 13 } } }}>
              <StatusChip status={trade.status} />
              <Chip size="small" icon={<VerifiedIcon />} label="Thiago Desk" sx={{ bgcolor: "#f0efff", color: "#3035bf", fontWeight: 900 }} />
              <Chip size="small" label={connected ? "Live" : "Reconnecting"} sx={{ bgcolor: connected ? "#eafff2" : "#fff6e5", color: connected ? "#0f7a40" : "#9a5b00", fontWeight: 1000 }} />
              <Chip size="small" label={money(trade.expectedNgn)} sx={{ bgcolor: "#f8fafc", color: "#08133b", border: "1px solid rgba(8,19,59,0.08)", fontWeight: 1000 }} />
              {hasReleasedCoin && <Chip size="small" label="Coin released" sx={{ bgcolor: "#eafff2", color: "#0f7a40", fontWeight: 1000 }} />}
            </Stack>
          </Stack>
          {trade.status === "pending" && (
            <Box sx={{ minWidth: { xs: "100%", sm: 170 }, maxWidth: { sm: 220 } }}>
              <TradeTimer trade={trade} onExpired={onRefresh} />
            </Box>
          )}
        </Stack>
      </Box>

      <Stack spacing={{ xs: 1, md: 1.5 }} sx={{ flex: 1, minHeight: 0 }}>
        <Alert
          severity="info"
          icon={<WalletIcon />}
          sx={{
            py: { xs: 0.7, md: 0.9 },
            px: { xs: 1, md: 1.4 },
            borderRadius: 2.5,
            bgcolor: "#f7f8ff",
            color: "#08133b",
            border: "1px solid rgba(87,87,246,0.12)",
            "& .MuiAlert-message": { py: 0, fontSize: { xs: 13.5, md: 15 }, lineHeight: 1.4 },
            "& .MuiAlert-icon": { py: 0.1, mr: 1 }
          }}
        >
          Send coin to <strong>{trade.walletAddress}</strong>
          <Tooltip title="Copy wallet">
            <IconButton size="small" onClick={() => navigator.clipboard.writeText(trade.walletAddress)} sx={{ ml: 0.5 }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Alert>

        <Stack
          spacing={0.85}
          sx={{
            flex: 1,
            minHeight: compact ? 320 : { xs: "50vh", md: "56vh" },
            maxHeight: compact ? 320 : "none",
            overflowY: "auto",
            pr: 0.5,
            p: { xs: 0.85, md: 1.1 },
            bgcolor: "#edf4f0",
            border: "1px solid rgba(8,19,59,0.08)",
            borderRadius: { xs: 2.5, md: 3.5 }
          }}
        >
          {messages.map((item) => {
            const isUser = item.sender === "user";
            const isAdmin = item.sender === "admin";
            const isSystem = item.sender === "system";
            const isMine = item.sender === viewerRole;
            return (
              <Stack key={item.id} direction="row" justifyContent={isMine ? "flex-end" : "flex-start"} sx={{ width: "100%" }}>
                <Box
                  sx={{
                    maxWidth: isSystem ? { xs: "78%", md: "62%" } : { xs: "78%", md: "68%" },
                    px: { xs: 1.15, md: 1.35 },
                    py: { xs: 0.8, md: 0.95 },
                    borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    bgcolor: isMine ? "#dcf8c6" : isSystem ? "#f7f8fa" : "#fff",
                    color: "#08133b",
                    border: isMine ? 0 : "1px solid rgba(8,19,59,0.07)",
                    boxShadow: isSystem ? "none" : "0 6px 18px rgba(8,19,59,0.08)",
                    position: "relative",
                    "&::after": isSystem
                      ? undefined
                      : {
                          content: "\"\"",
                          position: "absolute",
                          bottom: 0,
                          width: 10,
                          height: 10,
                          bgcolor: isMine ? "#dcf8c6" : "#fff",
                          right: isMine ? -3 : "auto",
                          left: isMine ? "auto" : -3,
                          clipPath: isMine ? "polygon(0 0, 100% 100%, 0 100%)" : "polygon(100% 0, 100% 100%, 0 100%)"
                        }
                  }}
                >
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 1000, color: isUser ? "#0f7a40" : isAdmin ? "#3035bf" : "#64708a", fontSize: { xs: 11.5, md: 12.5 }, lineHeight: 1.2 }}>
                    {isSystem ? "Thiago Bot" : isAdmin ? "Thiago Desk" : "You"}
                  </Typography>
                  <Typography sx={{ mt: 0.35, whiteSpace: "pre-wrap", fontSize: { xs: 13.5, md: 15 }, lineHeight: 1.45 }}>{item.body}</Typography>
                  {item.attachmentUrl && (
                    <Box
                      component="img"
                      src={item.attachmentUrl}
                      alt="Trade attachment"
                      sx={{ mt: 1, display: "block", maxWidth: "100%", borderRadius: 2, border: "1px solid rgba(8,19,59,0.10)" }}
                    />
                  )}
                  <Typography variant="caption" sx={{ display: "block", mt: 0.35, textAlign: "right", fontWeight: 800, color: "#64708a", fontSize: { xs: 10.5, md: 11.5 }, lineHeight: 1.2 }}>
                    {formatMessageTime(item.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Divider sx={{ borderColor: "rgba(87,87,246,0.12)" }} />

        {trade.status === "pending" || trade.status === "confirmed" ? (
          <Stack spacing={1.5}>
            {!hasReleasedCoin && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <TextField
                  size="small"
                  label="Transaction hash"
                  value={hash}
                  onChange={(event) => setHash(event.target.value)}
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><TagIcon fontSize="small" /></InputAdornment> }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 999, bgcolor: "#fff" } }}
                />
                <Button variant="outlined" onClick={saveHash} sx={{ minWidth: 190, borderColor: "rgba(87,87,246,0.28)" }}>
                  I Have Released Coin
                </Button>
              </Stack>
            )}
            {attachmentName && (
              <Chip
                icon={<AttachFileIcon />}
                label={attachmentName}
                onDelete={() => {
                  setAttachmentName("");
                  setAttachmentUrl("");
                }}
                sx={{ alignSelf: "flex-start" }}
              />
            )}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ p: 1, borderRadius: 5, bgcolor: "rgba(255,255,255,0.86)", border: "1px solid rgba(87,87,246,0.12)", boxShadow: "0 12px 34px rgba(8,19,59,0.08)" }}>
              <TextField
                label="Type account details or message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
                placeholder="Bank: Access Bank, Account: 0123456789, Name: ..."
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4, bgcolor: "#fff" } }}
              />
              <Button component="label" variant="outlined" startIcon={<AttachFileIcon />} sx={{ minWidth: 132, borderColor: "rgba(87,87,246,0.28)" }}>
                Attach
                <input hidden type="file" accept="image/*" onChange={(event) => attachFile(event.target.files?.[0])} />
              </Button>
              <Button variant="contained" endIcon={<SendIcon />} onClick={postMessage} sx={{ minWidth: 132, bgcolor: "#5757f6" }}>
                Send
              </Button>
              {trade.status === "pending" && (
                <Button color="error" variant="text" startIcon={<CancelIcon />} onClick={() => setCancelOpen(true)}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        ) : (
          <Alert severity={trade.status === "paid" ? "success" : "warning"}>{trade.receiptNote || `This trade is ${trade.status}.`}</Alert>
        )}
      </Stack>
      <Dialog
        open={cancelOpen}
        onClose={() => !canceling && setCancelOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            m: { xs: 1.5, sm: 3 },
            borderRadius: { xs: "24px 24px 12px 12px", sm: 3 },
            alignSelf: { xs: "flex-end", sm: "center" },
            width: { xs: "calc(100% - 24px)", sm: "100%" }
          }
        }}
      >
        <DialogTitle sx={{ pb: 0.5, fontWeight: 1000, color: "#08133b" }}>Cancel this trade?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: "#64708a", fontSize: 14.5, lineHeight: 1.55 }}>
            This will close the trading ground for {trade.coin} {usd(trade.amountUsd)}. Only continue if you no longer want to complete this trade.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
          <Button variant="text" onClick={() => setCancelOpen(false)} disabled={canceling}>
            Keep Trade
          </Button>
          <Button color="error" variant="contained" onClick={cancelTrade} disabled={canceling}>
            {canceling ? "Cancelling..." : "Yes, Cancel"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
