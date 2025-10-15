import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PriceUpdate {
  symbol: string;
  current_price: number;
  price_change_24h: number;
  market_cap?: number;
  volume_24h?: number;
}

export const useLivePrices = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,binancecoin,ripple,cardano,solana,polkadot,dogecoin&vs_currencies=eur&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true'
      );
      const data = await response.json();

      const cryptoMap: Record<string, string> = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'tether': 'USDT',
        'usd-coin': 'USDC',
        'binancecoin': 'BNB',
        'ripple': 'XRP',
        'cardano': 'ADA',
        'solana': 'SOL',
        'polkadot': 'DOT',
        'dogecoin': 'DOGE'
      };

      const updates: PriceUpdate[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        symbol: cryptoMap[key],
        current_price: value.eur,
        price_change_24h: value.eur_24h_change || 0,
        market_cap: value.eur_market_cap,
        volume_24h: value.eur_24h_vol
      }));

      return updates;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return [];
    }
  };

  const fetchStockPrices = async () => {
    try {
      // Using mock data for stocks as real-time stock APIs typically require authentication
      // In production, integrate with services like Alpha Vantage, Twelve Data, or Yahoo Finance
      const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'DIS', 'NKE'];
      
      // Mock price updates with realistic variations
      const updates: PriceUpdate[] = stockSymbols.map(symbol => {
        const basePrice = Math.random() * 300 + 50;
        const change = (Math.random() - 0.5) * 10;
        
        return {
          symbol,
          current_price: parseFloat(basePrice.toFixed(2)),
          price_change_24h: parseFloat(change.toFixed(2)),
          market_cap: basePrice * Math.random() * 1000000000,
          volume_24h: Math.random() * 100000000
        };
      });

      return updates;
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      return [];
    }
  };

  const updatePrices = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const [cryptoUpdates, stockUpdates] = await Promise.all([
        fetchCryptoPrices(),
        fetchStockPrices()
      ]);

      const allUpdates = [...cryptoUpdates, ...stockUpdates];

      // Update database with new prices and save to history
      for (const update of allUpdates) {
        // Update current price
        await supabase
          .from('trading_assets')
          .update({
            current_price: update.current_price,
            price_change_24h: update.price_change_24h,
            market_cap: update.market_cap,
            volume_24h: update.volume_24h,
            updated_at: new Date().toISOString()
          })
          .eq('symbol', update.symbol);

        // Save to price history
        await supabase
          .from('asset_price_history')
          .insert({
            symbol: update.symbol,
            price: update.current_price,
            market_cap: update.market_cap,
            volume_24h: update.volume_24h,
            timestamp: new Date().toISOString()
          });
      }

      console.log('Prices updated successfully');
    } catch (error) {
      console.error('Error updating prices:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // Initial update
    updatePrices();

    // Update every 60 seconds for crypto (CoinGecko free tier limit)
    const interval = setInterval(updatePrices, 60000);

    return () => clearInterval(interval);
  }, []);

  return { updatePrices, isUpdating };
};
