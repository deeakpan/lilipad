import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // GeckoTerminal API endpoint for the pool
  const poolId = 'eth_0xb1b10b05aa043dd8d471d4da999782bc694993e3ecbe8e7319892b261b412ed5';
  const url = `https://api.geckoterminal.com/api/v2/networks/eth/pools/0xb1b10b05aa043dd8d471d4da999782bc694993e3ecbe8e7319892b261b412ed5`;

  try {
    const res = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch price data' }), { status: 500 });
    }
    const data = await res.json();
    // Get the price of the token in USD (assume base token)
    const priceStr = data?.data?.attributes?.base_token_price_usd;
    const price = priceStr ? parseFloat(priceStr) : null;
    if (!price || isNaN(price) || price <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid price data' }), { status: 500 });
    }
    // Calculate how much token is worth $10
    const amount = 10 / price;
    // eslint-disable-next-line no-console
    console.log(`$10 USD = ${amount.toFixed(6)} tokens (1 token = $${price.toFixed(6)})`);
    return new Response(JSON.stringify({ amount, price, usd: 10 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error fetching price data' }), { status: 500 });
  }
} 