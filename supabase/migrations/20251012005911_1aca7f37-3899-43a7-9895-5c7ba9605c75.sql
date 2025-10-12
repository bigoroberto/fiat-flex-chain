-- Popola la tabella trading_assets con asset realistici

-- Cancella i dati esistenti
DELETE FROM trading_assets;

-- Inserisci criptovalute popolari
INSERT INTO trading_assets (symbol, name, asset_type, current_price, price_change_24h, market_cap, volume_24h) VALUES
('BTC', 'Bitcoin', 'crypto', 58423.50, 3.45, 1145000000000, 28500000000),
('ETH', 'Ethereum', 'crypto', 3245.80, 5.23, 389000000000, 15200000000),
('USDT', 'Tether', 'crypto', 1.00, 0.01, 83000000000, 45000000000),
('BNB', 'Binance Coin', 'crypto', 412.35, 2.87, 62000000000, 1200000000),
('SOL', 'Solana', 'crypto', 142.67, 8.92, 59000000000, 2300000000),
('XRP', 'Ripple', 'crypto', 0.5234, -1.45, 27000000000, 1100000000),
('DOGE', 'Dogecoin', 'crypto', 0.0876, 1.23, 12400000000, 580000000),
('ADA', 'Cardano', 'crypto', 0.4523, 3.67, 16000000000, 450000000),
('AVAX', 'Avalanche', 'crypto', 28.45, 6.12, 10000000000, 320000000),
('MATIC', 'Polygon', 'crypto', 0.7234, 4.56, 6700000000, 280000000),
('DOT', 'Polkadot', 'crypto', 5.67, -2.34, 7800000000, 180000000),
('LINK', 'Chainlink', 'crypto', 14.23, 2.89, 7900000000, 420000000);

-- Inserisci azioni tech popolari
INSERT INTO trading_assets (symbol, name, asset_type, current_price, price_change_24h, market_cap, volume_24h) VALUES
('AAPL', 'Apple Inc.', 'stock', 178.45, 1.23, 2800000000000, 52000000000),
('MSFT', 'Microsoft Corporation', 'stock', 415.67, 0.87, 3100000000000, 28000000000),
('GOOGL', 'Alphabet Inc.', 'stock', 139.82, 2.34, 1750000000000, 23000000000),
('AMZN', 'Amazon.com Inc.', 'stock', 145.23, -0.56, 1500000000000, 31000000000),
('NVDA', 'NVIDIA Corporation', 'stock', 485.92, 4.67, 1200000000000, 45000000000),
('TSLA', 'Tesla Inc.', 'stock', 245.78, 3.21, 780000000000, 89000000000),
('META', 'Meta Platforms Inc.', 'stock', 312.45, 1.89, 800000000000, 18000000000),
('NFLX', 'Netflix Inc.', 'stock', 456.23, -1.23, 200000000000, 4500000000),
('AMD', 'Advanced Micro Devices', 'stock', 112.34, 5.12, 182000000000, 8900000000),
('INTC', 'Intel Corporation', 'stock', 45.67, -0.45, 187000000000, 7200000000);

-- Inserisci azioni di brand famosi
INSERT INTO trading_assets (symbol, name, asset_type, current_price, price_change_24h, market_cap, volume_24h) VALUES
('NKE', 'Nike Inc.', 'stock', 98.45, 1.67, 152000000000, 6800000000),
('DIS', 'Walt Disney Company', 'stock', 92.34, 0.98, 168000000000, 8900000000),
('MCD', 'McDonald''s Corporation', 'stock', 289.56, 0.45, 210000000000, 3400000000),
('SBUX', 'Starbucks Corporation', 'stock', 98.76, 1.23, 112000000000, 4200000000),
('COCA', 'Coca-Cola Company', 'stock', 58.92, 0.34, 252000000000, 12000000000),
('PEP', 'PepsiCo Inc.', 'stock', 172.45, 0.67, 237000000000, 4500000000),
('BA', 'Boeing Company', 'stock', 187.23, -1.89, 115000000000, 7800000000),
('JPM', 'JPMorgan Chase & Co.', 'stock', 156.78, 1.45, 448000000000, 11000000000),
('V', 'Visa Inc.', 'stock', 245.89, 0.78, 512000000000, 6700000000),
('MA', 'Mastercard Inc.', 'stock', 389.45, 1.12, 368000000000, 3900000000);

-- Inserisci altri asset popolari
INSERT INTO trading_assets (symbol, name, asset_type, current_price, price_change_24h, market_cap, volume_24h) VALUES
('WMT', 'Walmart Inc.', 'stock', 52.34, 0.89, 412000000000, 8900000000),
('JNJ', 'Johnson & Johnson', 'stock', 156.23, 0.56, 383000000000, 6200000000),
('PG', 'Procter & Gamble', 'stock', 148.92, 0.34, 350000000000, 5100000000),
('UNH', 'UnitedHealth Group', 'stock', 512.67, 1.89, 482000000000, 4300000000),
('HD', 'Home Depot Inc.', 'stock', 312.45, 1.23, 321000000000, 3800000000),
('BAC', 'Bank of America Corp', 'stock', 31.23, 0.67, 245000000000, 42000000000),
('XOM', 'Exxon Mobil Corporation', 'stock', 108.45, -0.89, 452000000000, 18000000000),
('CVX', 'Chevron Corporation', 'stock', 156.78, -0.45, 298000000000, 8900000000);

-- Inserisci alcune altcoin emergenti
INSERT INTO trading_assets (symbol, name, asset_type, current_price, price_change_24h, market_cap, volume_24h) VALUES
('UNI', 'Uniswap', 'crypto', 6.78, 7.23, 4100000000, 180000000),
('ATOM', 'Cosmos', 'crypto', 9.23, 4.56, 2800000000, 98000000),
('FIL', 'Filecoin', 'crypto', 4.56, 3.21, 2100000000, 120000000),
('APT', 'Aptos', 'crypto', 8.92, 9.45, 1900000000, 150000000),
('ARB', 'Arbitrum', 'crypto', 1.12, 5.67, 1400000000, 230000000),
('OP', 'Optimism', 'crypto', 1.87, 6.34, 1800000000, 180000000);