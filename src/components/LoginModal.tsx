import { useState } from "react";
import { useApp } from "../contexts/AppContext";

type Props = { onClose: () => void };

export default function LoginModal({ onClose }: Props) {
  const { login } = useApp();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await login(nickname.trim(), email.trim());
      onClose();
    } catch (e: any) {
      setError("로그인 중 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👋</div>
          <h2 className="text-xl font-bold text-[#2D2D2D]" style={{ fontFamily: "'Nunito', sans-serif" }}>
            챌린지 시작하기
          </h2>
          <p className="text-sm text-[#8B7B72] mt-1">닉네임과 이메일로 간단하게 시작해요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="예: 봄이, 해맑음, sunshine"
              className="w-full px-4 py-3 rounded-2xl border border-[#EAE0D8] bg-[#FFF8F3] text-[#2D2D2D] placeholder-[#C4B8B0] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/40 text-sm"
              required
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-2xl border border-[#EAE0D8] bg-[#FFF8F3] text-[#2D2D2D] placeholder-[#C4B8B0] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/40 text-sm"
              required
            />
            <p className="text-xs text-[#8B7B72] mt-1">다른 기기에서도 기록을 이어볼 수 있어요 ✨</p>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !nickname.trim() || !email.trim()}
            className="w-full py-4 rounded-2xl bg-[#FF6B6B] text-white font-bold text-base disabled:opacity-50 active:scale-95 transition-transform"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            {loading ? "로딩 중..." : "챌린지 시작! 🚀"}
          </button>
        </form>

        <p className="text-xs text-center text-[#8B7B72] mt-4">
          이전에 참여했다면 같은 이메일을 입력하면 기록이 연동돼요
        </p>
      </div>
    </div>
  );
}
