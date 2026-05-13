import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export const coinIconUrls: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  BNB: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  XRP: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
  USDT: "https://assets.coingecko.com/coins/images/325/large/Tether.png"
};

export function CoinIcon({ coin, size = 40 }: { coin: string; size?: number }) {
  const symbol = coin.toUpperCase();
  return (
    <Avatar
      src={coinIconUrls[symbol]}
      alt={`${symbol} icon`}
      sx={{
        width: size,
        height: size,
        bgcolor: "#fff",
        border: "1px solid rgba(37,99,235,0.12)",
        boxShadow: "0 8px 20px rgba(15,23,42,0.10)",
        "& img": { objectFit: "contain", p: 0.35 }
      }}
    >
      {symbol.slice(0, 1)}
    </Avatar>
  );
}

export function CoinPairIcons({ base, quote = "USDT", size = 30 }: { base: string; quote?: string; size?: number }) {
  return (
    <Stack direction="row" spacing={-1} alignItems="center" aria-label={`${base}/${quote}`}>
      <CoinIcon coin={base} size={size} />
      <CoinIcon coin={quote} size={Math.max(20, size - 6)} />
    </Stack>
  );
}

export function CoinOnlyLabel({ coin, size = 22 }: { coin: string; size?: number }) {
  return (
    <Stack component="span" direction="row" spacing={0.7} alignItems="center">
      <CoinIcon coin={coin} size={size} />
      <Typography component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {coin}
      </Typography>
    </Stack>
  );
}
