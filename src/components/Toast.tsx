"use client";

/**
 * components/Toast.tsx
 * トースト通知（成功・エラー）
 */

import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className={styles.container} aria-live="polite">
      {messages.map((msg) => (
        <ToastItem key={msg.id} msg={msg} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  msg,
  onRemove,
}: {
  msg: ToastMessage;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // マウント後にアニメーション開始
    const t1 = setTimeout(() => setVisible(true), 10);
    // 3秒後に非表示にしてから削除
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(msg.id), 300);
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [msg.id, onRemove]);

  const icons = { success: "✓", error: "✕", info: "ℹ" };

  return (
    <div
      className={`${styles.toast} ${styles[msg.type]} ${visible ? styles.visible : ""}`}
    >
      <span className={styles.icon}>{icons[msg.type]}</span>
      <span className={styles.message}>{msg.message}</span>
      <button
        className={styles.close}
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(msg.id), 300);
        }}
      >
        ×
      </button>
    </div>
  );
}
