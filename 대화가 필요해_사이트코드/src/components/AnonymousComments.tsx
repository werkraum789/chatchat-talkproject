import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type AnonymousComment = {
  id: string;
  content: string;
  created_at: string;
};

const BLOCKED_LANGUAGE = [
  "시발",
  "씨발",
  "ㅅㅂ",
  "병신",
  "ㅂㅅ",
  "개새끼",
  "새끼",
  "존나",
  "좆",
  "fuck",
  "shit",
  "bitch",
];

function containsBlockedLanguage(value: string) {
  const normalized = value.toLowerCase().replace(/[\s._\-*!?]+/g, "");
  return BLOCKED_LANGUAGE.some(word => normalized.includes(word));
}

type Props = {
  entryId: string;
  canComment: boolean;
  commenterId?: string;
  allowAdminFallback?: boolean;
  onRequireLogin?: () => void;
};

export default function AnonymousComments({
  entryId,
  canComment,
  commenterId,
  allowAdminFallback = false,
  onRequireLogin,
}: Props) {
  const [comments, setComments] = useState<AnonymousComment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasBlockedLanguage = containsBlockedLanguage(content);

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at")
      .eq("entry_id", entryId)
      .order("created_at");
    setComments((data || []) as AnonymousComment[]);
  }

  useEffect(() => {
    loadComments().catch(() => {});
  }, [entryId]);

  async function submitComment() {
    if (!canComment) {
      onRequireLogin?.();
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) return;
    if (containsBlockedLanguage(trimmed)) {
      setError("부적절한 표현이 포함되어 있어 댓글을 등록할 수 없어요.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      let authorId = commenterId;
      if (!authorId && allowAdminFallback) {
        const { data, error } = await supabase
          .from("users")
          .upsert(
            { nickname: "관리자", email: "anonymous-admin@challenge.local" },
            { onConflict: "email" },
          )
          .select("id")
          .single();
        if (error || !data) throw error || new Error("comment_failed");
        authorId = data.id;
      }
      if (!authorId) throw new Error("comment_failed");
      const { error } = await supabase.from("comments").insert({
        entry_id: entryId,
        user_id: authorId,
        content: trimmed,
        is_anonymous: true,
      });
      if (error) throw error;
      setContent("");
      await loadComments();
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message === "inappropriate_language"
          ? "부적절한 표현이 포함되어 있어 댓글을 등록할 수 없어요."
          : "댓글을 등록하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-muted">
      <button
        onClick={() => setExpanded(current => !current)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-bold text-subtext"
      >
        <span>익명 댓글 {comments.length > 0 ? comments.length : ""}</span>
        <span>{expanded ? "접기" : "보기"}</span>
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-muted px-4 py-3">
          {comments.length === 0 ? (
            <p className="text-center text-xs text-subtext">아직 댓글이 없어요.</p>
          ) : (
            <div className="space-y-2">
              {comments.map(comment => (
                <div key={comment.id} className="rounded-2xl bg-background px-3 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-text">익명</span>
                    <span className="text-[10px] text-subtext">
                      {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-subtext">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={content}
              onChange={event => {
                const nextContent = event.target.value;
                setContent(nextContent);
                setError(
                  containsBlockedLanguage(nextContent)
                    ? "부적절한 표현이 포함되어 있어 댓글을 등록할 수 없어요."
                    : "",
                );
              }}
              onFocus={() => {
                if (!canComment) onRequireLogin?.();
              }}
              onKeyDown={event => {
                if (event.key === "Enter") submitComment();
              }}
              placeholder="익명 댓글을 남겨보세요"
              maxLength={200}
              className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <button
              onClick={submitComment}
              disabled={submitting || !content.trim() || hasBlockedLanguage}
              className="rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {submitting ? "등록 중" : "등록"}
            </button>
          </div>
          <p className="text-[10px] text-subtext">모든 댓글은 익명으로 표시되며 부적절한 표현은 등록할 수 없어요.</p>
          {error && <p className="text-xs font-medium text-primary">{error}</p>}
        </div>
      )}
    </div>
  );
}
