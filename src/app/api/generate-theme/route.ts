/**
 * app/api/generate-theme/route.ts
 * POST /api/generate-theme
 *
 * 処理フロー：
 * 1. Notion から過去テーマを取得
 * 2. Gemini でテーマを生成
 * 3. Notion に新しいテーマを保存（ステータス: 未作成）
 */

import { NextResponse } from "next/server";
import { generateTheme } from "@/lib/gemini";
import { getPastThemes, createTheme } from "@/lib/notion";

export async function POST() {
  console.log("[generate-theme] 開始");

  try {
    // ── Step 1: 過去のテーマを取得（重複防止）──
    console.log("[generate-theme] 過去テーマを取得中...");
    const pastThemes = await getPastThemes();
    console.log(`[generate-theme] 過去テーマ数: ${pastThemes.length}件`);

    // ── Step 2: Gemini でテーマを生成 ──
    console.log("[generate-theme] Gemini でテーマ生成中...");
    const theme = await generateTheme(pastThemes);
    console.log("[generate-theme] 生成テーマ:", theme);

    // ── Step 3: Notion に保存 ──
    console.log("[generate-theme] Notion に保存中...");
    const article = await createTheme(theme);
    console.log("[generate-theme] Notion 保存完了. ID:", article.id);

    return NextResponse.json({
      success: true,
      message: "テーマの生成・保存が完了しました",
      data: {
        id: article.id,
        theme: theme,
        status: "未作成",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    console.error("[generate-theme] エラー:", message);

    return NextResponse.json(
      {
        success: false,
        message: "テーマの生成に失敗しました",
        error: message,
      },
      { status: 500 }
    );
  }
}

// GET リクエストは許可しない（セキュリティ）
export async function GET() {
  return NextResponse.json({ message: "POST メソッドを使用してください" }, { status: 405 });
}
