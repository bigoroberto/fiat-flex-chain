import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
}

export const useLivePricesAPI = (symbols: string[] = []) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (symbols.length === 0) return;
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [symbols]);

  const fetchLivePrices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Separate crypto and stock symbols
      const cryptoSymbols = symbols.filter(s => ["BTC", "ETH", "USDT", "USDC", "BNB", "XRP", "ADA", "SOL", "DOT", "DOGE", "LTC", "LINK", "XLM", "XMR", "ETC", "AVAX", "MATIC", "SHIB", "UNI", "ATOM", "ALGO", "NEAR", "APE", "ICP", "FIL", "HBAR", "VET", "TRX", "EOS", "XTZ", "EGLD", "AAVE", "MKR"].includes(s));
      const stockSymbols = symbols.filter(s => !cryptoSymbols.includes(s));

      const pricesData: Record<string, PriceData> = {};

      // Fetch crypto prices from CoinGecko (free API, no key required)
      if (cryptoSymbols.length > 0) {
        const cryptoPrices = await fetchCryptoFromCoinGecko(cryptoSymbols);
        Object.assign(pricesData, cryptoPrices);
      }

      // Fetch stock prices from database (pre-configured)
      if (stockSymbols.length > 0) {
        const stockPrices = await fetchStocksFromDatabase(stockSymbols);
        Object.assign(pricesData, stockPrices);
      }

      setPrices(pricesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch prices";
      setError(errorMessage);
      console.error("Error fetching live prices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCryptoFromCoinGecko = async (symbols: string[]): Promise<Record<string, PriceData>> => {
    // Map symbols to CoinGecko IDs
    const symbolToId: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      USDT: "tether",
      USDC: "usd-coin",
      BNB: "binancecoin",
      XRP: "ripple",
      ADA: "cardano",
      SOL: "solana",
      DOT: "polkadot",
      DOGE: "dogecoin",
      LTC: "litecoin",
      LINK: "chainlink",
      XLM: "stellar",
      XMR: "monero",
      ETC: "ethereum-classic",
      AVAX: "avalanche-2",
      MATIC: "matic-network",
      SHIB: "shiba-inu",
      UNI: "uniswap",
      ATOM: "cosmos",
      ALGO: "algorand",
      NEAR: "near",
      APE: "apecoin",
      ICP: "internet-computer",
      FIL: "filecoin",
      HBAR: "hedera-hashgraph",
      VET: "vechain",
      TRX: "tron",
      EOS: "eos",
      XTZ: "tezos",
      EGLD: "elrond",
      AAVE: "aave",
      MKR: "maker",
    };

    const ids = symbols
      .map(s => symbolToId[s])
      .filter(Boolean)
      .join(",");

    if (!ids) return {};

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
      );

      if (!response.ok) throw new Error("CoinGecko API error");

      const data = await response.json();
      const pricesData: Record<string, PriceData> = {};

      symbols.forEach(symbol => {
        const id = symbolToId[symbol];
        if (id && data[id]) {
          pricesData[symbol] = {
            symbol,
            price: data[id].eur || 0,
            change24h: data[id].eur_24h_change || 0,
            marketCap: data[id].eur_market_cap,
            volume24h: data[id].eur_24h_vol,
          };
        }
      });

      return pricesData;
    } catch (error) {
      console.error("CoinGecko fetch error:", error);
      return {};
    }
  };

  const fetchStocksFromDatabase = async (symbols: string[]): Promise<Record<string, PriceData>> => {
    try {
      const { data, error } = await supabase
        .from("trading_assets")
        .select("symbol, current_price, price_change_24h, market_cap, volume_24h")
        .in("symbol", symbols);

      if (error) throw error;

      const pricesData: Record<string, PriceData> = {};
      data?.forEach(asset => {
        pricesData[asset.symbol] = {
          symbol: asset.symbol,
          price: parseFloat(asset.current_price),
          change24h: parseFloat(asset.price_change_24h),
          marketCap: asset.market_cap,
          volume24h: asset.volume_24h,
        };
      });

      return pricesData;
    } catch (error) {
      console.error("Database fetch error:", error);
      return {};
    }
  };

  return { prices, isLoading, error, refetch: fetchLivePrices };
};
