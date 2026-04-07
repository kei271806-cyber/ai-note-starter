/**
 * app/api/articles/route.ts
 * GET /api/articles - 記事一覧を返す
 */

import { NextResponse } from "next/server";
import { getArticles } from "@/lib/notion";

export async function GET() {
  try {
    const articles = await getArticles();
    return NextResponse.json({ success: true, articles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    console.error("[articles] エラー:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
