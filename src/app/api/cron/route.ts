/**
 * app/api/cron/route.ts
 * GET /api/cron
 *
 * Vercel Cron から毎日 JST 10:00（UTC 01:00）に呼び出される
 * 処理：テーマ生成 → 記事生成 を順番に実行
 *
 * セキュリティ：CRON_SECRET で認証
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // 最大実行時間 5分（Vercel Pro プランでの設定）

export async function GET(req: NextRequest) {
  console.log("[cron] Vercel Cron ジョブ開始:", new Date().toISOString());

  // ── セキュリティ認証 ──
  // Vercel は自動的に Authorization ヘッダーを付与する
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron] 認証失敗: 不正なアクセス");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    themeGeneration: { success: false, message: "", data: null as unknown },
    articleGeneration: { success: false, message: "", data: null as unknown },
  };

  // ── Step 1: テーマ生成 ──
  try {
    console.log("[cron] テーマ生成 API を呼び出し中...");

    // 内部APIを呼び出す（絶対URLが必要）
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const themeRes = await fetch(`${baseUrl}/api/generate-theme`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // cron シークレットを内部APIにも渡す
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const themeData = await themeRes.json();
    results.themeGeneration = {
      success: themeData.success,
      message: themeData.message,
      data: themeData.data,
    };

    if (!themeData.success) {
      console.error("[cron] テーマ生成失敗:", themeData.error);
    } else {
      console.log("[cron] テーマ生成成功:", themeData.data?.theme);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    console.error("[cron] テーマ生成エラー:", message);
    results.themeGeneration = { success: false, message, data: null };
  }

  // テーマ生成後に少し待機（APIレート制限対策）
  await new Promise((r) => setTimeout(r, 2000));

  // ── Step 2: 記事生成 ──
  try {
    console.log("[cron] 記事生成 API を呼び出し中...");

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const articleRes = await fetch(`${baseUrl}/api/generate-article`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const articleData = await articleRes.json();
    results.articleGeneration = {
      success: articleData.success,
      message: articleData.message,
      data: articleData.data,
    };

    if (!articleData.success) {
      console.error("[cron] 記事生成失敗:", articleData.error);
    } else {
      console.log("[cron] 記事生成成功:", articleData.data?.titles?.[0]);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    console.error("[cron] 記事生成エラー:", message);
    results.articleGeneration = { success: false, message, data: null };
  }

  const allSuccess =
    results.themeGeneration.success && results.articleGeneration.success;

  console.log("[cron] 完了:", allSuccess ? "全成功" : "一部失敗", results);

  return NextResponse.json({
    success: allSuccess,
    executedAt: new Date().toISOString(),
    results,
  });
}
