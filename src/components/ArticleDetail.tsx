"use client";

/**
 * components/ArticleDetail.tsx
 * 記事詳細パネル：本文表示・コピー・再生成
 */

import { useState } from "react";
import { Article } from "@/lib/notion";
import styles from "./ArticleDetail.module.css";

interface ArticleDetailProps {
  article: Article;
  onRegenerate: (pageId: string, theme: string) => Promise<void>;
  isLoading: boolean;
}

// 簡易 Markdown → HTML 変換
function renderMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .split("\n\n")
    .map((p) =>
      p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<blockquote")
        ? p
        : `<p>${p.replace(/\n/g, "<br>")}</p>`
    )
    .join("");
}

export default function ArticleDetail({
  article,
  onRegenerate,
  isLoading,
}: ArticleDetailProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  // タイトル案をパース
  const titles = article.titleCandidates
    ? article.titleCandidates
        .split("\n")
        .map((t) => t.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean)
    : [];

  // 本文をコピー
  const handleCopyBody = async () => {
    const text = article.body || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      // フォールバック
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  };

  // タイトルをコピー
  const handleCopyTitle = async (title: string) => {
    await navigator.clipboard.writeText(title).catch(() => {});
  };

  // 文字数
  const charCount = article.body
    ? article.body.replace(/[#*\n`]/g, "").length
    : 0;

  // 文字数バーの幅（2000〜3000を適正範囲として計算）
  const barPct = Math.min(100, (charCount / 3000) * 100);
  const isGoodLength = charCount >= 2000 && charCount <= 3000;

  if (!article.body && article.status === "未作成") {
    // 未生成状態
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✦</div>
        <h3 className={styles.emptyTitle}>記事がまだ生成されていません</h3>
        <p className={styles.emptySub}>
          テーマ：「{article.title}」
        </p>
        <button
          className={styles.generateBtn}
          onClick={() => onRegenerate(article.id, article.title)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner} />
              生成中...
            </>
          ) : (
            <>⚡ この記事を生成する</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* ── テーマ見出し ── */}
      <div className={styles.themeHeader}>
        <span className={styles.themeLabel}>THEME</span>
        <h2 className={styles.themeText}>{article.title}</h2>
        <time className={styles.themeDate}>{article.createdAt}</time>
      </div>

      {/* ── タイトル案 ── */}
      {titles.length > 0 && (
        <div className={styles.titlesSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>タイトル案</span>
            <span className={styles.sectionCount}>{titles.length}案</span>
          </div>
          <div className={styles.titleList}>
            {titles.map((title, i) => (
              <div key={i} className={styles.titleItem}>
                <span className={styles.titleNum}>0{i + 1}</span>
                <span className={styles.titleText}>{title}</span>
                <button
                  className={styles.titleCopyBtn}
                  onClick={() => handleCopyTitle(title)}
                  title="コピー"
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 記事本文ツールバー ── */}
      <div className={styles.articleSection}>
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "preview" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              プレビュー
            </button>
            <button
              className={`${styles.tab} ${activeTab === "raw" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("raw")}
            >
              Markdown
            </button>
          </div>
          <div className={styles.toolbarActions}>
            <button
              className={`${styles.actionBtn} ${copyState === "copied" ? styles.actionBtnSuccess : styles.actionBtnPrimary}`}
              onClick={handleCopyBody}
              disabled={!article.body}
            >
              {copyState === "copied" ? "✓ コピー完了！" : "📄 本文をコピー"}
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => onRegenerate(article.id, article.title)}
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className={styles.spinner} /> 生成中...</>
              ) : (
                "🔄 再生成"
              )}
            </button>
          </div>
        </div>

        {/* 記事本文 */}
        <div className={styles.articleBody}>
          {activeTab === "preview" ? (
            <div
              className={`markdown-body ${styles.preview}`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
            />
          ) : (
            <pre className={styles.raw}>{article.body}</pre>
          )}
        </div>

        {/* 文字数ステータスバー */}
        <div className={styles.statsBar}>
          <span className={styles.statLabel}>
            文字数：
            <strong className={isGoodLength ? styles.statGood : styles.statWarn}>
              {charCount.toLocaleString()} 字
            </strong>
          </span>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${isGoodLength ? styles.barGood : styles.barWarn}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
          <span className={styles.statTarget}>目標：2,000〜3,000 字</span>
        </div>
      </div>
    </div>
  );
}
