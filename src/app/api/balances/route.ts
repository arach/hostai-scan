import { NextResponse } from "next/server";

export async function GET() {
  const results: {
    semrush: { units: number | null; error?: string };
    dataForSEO: { balance: number | null; spent: number | null; error?: string };
    fetchedAt: string;
  } = {
    semrush: { units: null },
    dataForSEO: { balance: null, spent: null },
    fetchedAt: new Date().toISOString(),
  };

  // Fetch SEMrush balance (free)
  const semrushKey = process.env.SEMRUSH_API_KEY;
  if (semrushKey) {
    try {
      const res = await fetch(
        `https://www.semrush.com/users/countapiunits.html?key=${semrushKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const text = await res.text();
      const units = parseInt(text.trim(), 10);
      if (!isNaN(units)) {
        results.semrush.units = units;
      } else {
        results.semrush.error = text.substring(0, 100);
      }
    } catch (err) {
      results.semrush.error = String(err);
    }
  } else {
    results.semrush.error = "No API key configured";
  }

  // Fetch DataForSEO balance (free)
  const dfsLogin = process.env.DATAFORSEO_LOGIN;
  const dfsPassword = process.env.DATAFORSEO_PASSWORD;
  if (dfsLogin && dfsPassword) {
    try {
      const res = await fetch(
        "https://api.dataforseo.com/v3/appendix/user_data",
        {
          headers: {
            Authorization: "Basic " + Buffer.from(`${dfsLogin}:${dfsPassword}`).toString("base64"),
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      const data = await res.json();
      const money = data?.tasks?.[0]?.result?.[0]?.money;
      if (money) {
        results.dataForSEO.balance = money.balance;
        results.dataForSEO.spent = money.total;
      }
    } catch (err) {
      results.dataForSEO.error = String(err);
    }
  } else {
    results.dataForSEO.error = "No credentials configured";
  }

  return NextResponse.json(results);
}
