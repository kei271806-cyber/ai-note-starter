/**
 * app/api/articles/[id]/route.ts
 * GET /api/articles/:id - 記事詳細を返す
 */

import { NextRequest, NextResponse } from "next/server";
import { getArticleById } from "@/lib/notion";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const article = await getArticleById(params.id);
    if (!article) {
      return NextResponse.json(
        { success: false, error: "記事が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, article });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
