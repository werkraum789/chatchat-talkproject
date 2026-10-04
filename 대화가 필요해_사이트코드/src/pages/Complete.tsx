import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { useApp } from "../contexts/AppContext";

export default function Complete() {
  const { user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const colors = ["#FF6B6B", "#B5EAD7", "#C7CEEA", "#FFDAC1", "#FFB347"];

    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F3] to-[#FFE8E8] flex flex-col items-center justify-center px-6 text-center pb-24">
      <div className="text-6xl mb-4">🎓</div>
      <h1 className="font-display text-3xl font-black text-[#2D2D2D] mb-2">
        수료를 축하해요!
      </h1>
      <p className="text-lg text-[#8B7B72] mb-6">
        {user?.nickname || "참가자"}님,<br />
        3주 챌린지를 완주하셨어요! 🎉
      </p>

      {/* Badges */}
      <div className="flex gap-4 mb-6">
        {["🌱", "🌿", "🌳"].map((badge, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-3xl">
              {badge}
            </div>
            <span className="text-xs text-[#8B7B72]">{i+1}주차</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EAE0D8] max-w-xs w-full mb-6">
        <div className="text-4xl mb-2">🏆</div>
        <div className="font-display text-xl font-black text-[#FF6B6B]">3주 챌린지 수료증</div>
        <div className="text-sm text-[#8B7B72] mt-1">{user?.nickname || "참가자"}</div>
        <div className="text-xs text-[#C4B8B0] mt-0.5">{new Date().toLocaleDateString("ko-KR")}</div>
      </div>

      <button
        onClick={() => navigate("/")}
        className="px-8 py-4 rounded-2xl bg-[#FF6B6B] text-white font-bold text-base"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
