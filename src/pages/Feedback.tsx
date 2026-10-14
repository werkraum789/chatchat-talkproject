import { useState } from "react";
import confetti from "canvas-confetti";
import { useApp } from "../contexts/AppContext";
import { supabase } from "../lib/supabase";
import LoginModal from "../components/LoginModal";

type Category = "mission" | "process" | "other";

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "mission", label: "미션 내용", icon: "🎯" },
  { value: "process", label: "진행 방식", icon: "⚙️" },
  { value: "other", label: "기타", icon: "💡" },
];

const SURVEY_QUESTIONS = [
  "이번 주 미션이 얼마나 마음에 드셨나요?",
  "챌린지 진행 방식에 얼마나 만족하셨나요?",
  "다음 챌린지에도 참여하고 싶으신가요?",
];

export default function Feedback() {
  const { user } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab] = useState<"feedback" | "survey">("feedback");

  // Feedback form
  const [category, setCategory] = useState<Category>("mission");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Survey form
  const [surveyWeek, setSurveyWeek] = useState<1 | 2 | 3>(1);
  const [scores, setScores] = useState<number[]>([0, 0, 0]);
  const [surveyText, setSurveyText] = useState("");
  const [surveyAnonymous, setSurveyAnonymous] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveyDone, setSurveyDone] = useState(false);

  function fireConfetti() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FF6B6B", "#B5EAD7", "#C7CEEA", "#FFDAC1", "#FFB347"],
    });
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    await supabase.from("feedback").insert({
      user_id: isAnonymous ? null : user?.id || null,
      category,
      content,
      is_anonymous: isAnonymous,
    });
    setSubmitting(false);
    setDone(true);
    fireConfetti();
  }

  async function handleSurveySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (scores.some(s => s === 0)) return;
    setSurveySubmitting(true);
    await supabase.from("survey_responses").insert({
      user_id: surveyAnonymous ? null : user?.id || null,
      week: surveyWeek,
      q1_score: scores[0],
      q2_score: scores[1],
      q3_score: scores[2],
      q_text: surveyText || null,
      is_anonymous: surveyAnonymous,
    });
    setSurveySubmitting(false);
    setSurveyDone(true);
    fireConfetti();
  }

  if (done || surveyDone) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center px-5 pb-24">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display text-2xl font-black text-[#2D2D2D] mb-2">고마워요!</h2>
        <p className="text-sm text-[#8B7B72] text-center mb-6">
          소중한 의견을 나눠주셔서 정말 감사해요 💕<br />덕분에 더 좋은 챌린지를 만들 수 있어요.
        </p>
        <button
          onClick={() => { setDone(false); setSurveyDone(false); setContent(""); setScores([0,0,0]); setSurveyText(""); }}
          className="px-6 py-3 rounded-2xl bg-[#FF6B6B] text-white font-bold"
        >
          또 남기기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-24">
      <div className="px-5 pt-8 pb-4">
        <h1 className="font-display text-2xl font-black text-[#2D2D2D] mb-1">피드백 · 설문 ✍️</h1>
        <p className="text-sm text-[#8B7B72] mb-4">언제든 편하게 남겨주세요!</p>

        {/* Tab */}
        <div className="flex gap-2 mb-5 bg-[#F5EEE8] rounded-2xl p-1">
          <button
            onClick={() => setTab("feedback")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "feedback" ? "bg-white text-[#FF6B6B] shadow-sm" : "text-[#8B7B72]"}`}
          >
            💬 자유 피드백
          </button>
          <button
            onClick={() => setTab("survey")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "survey" ? "bg-white text-[#FF6B6B] shadow-sm" : "text-[#8B7B72]"}`}
          >
            📊 주차별 설문
          </button>
        </div>

        {tab === "feedback" ? (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <p className="text-sm font-semibold text-[#2D2D2D] mb-2">카테고리</p>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`py-3 rounded-2xl text-sm font-bold text-center transition-all ${
                      category === c.value ? "bg-[#FF6B6B] text-white" : "bg-white border border-[#EAE0D8] text-[#8B7B72]"
                    }`}
                  >
                    <div className="text-xl mb-0.5">{c.icon}</div>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-sm font-semibold text-[#2D2D2D] mb-2">내용</p>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="솔직하게 남겨주세요. 모든 의견이 소중해요 🙏"
                className="w-full px-4 py-3 rounded-2xl border border-[#EAE0D8] bg-white text-sm text-[#2D2D2D] placeholder-[#C4B8B0] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/40"
                rows={5}
                required
                maxLength={500}
              />
              <div className="text-right text-[11px] text-[#8B7B72]">{content.length}/500</div>
            </div>

            {/* Anonymous */}
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl w-full text-sm ${isAnonymous ? "bg-[#FFE8E8] text-[#FF6B6B]" : "bg-[#F5EEE8] text-[#8B7B72]"}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isAnonymous ? "bg-[#FF6B6B] border-[#FF6B6B]" : "border-[#C4B8B0]"}`}>
                {isAnonymous && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </span>
              <span className="font-medium">익명으로 제출하기</span>
            </button>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="w-full py-4 rounded-2xl bg-[#FF6B6B] text-white font-bold text-base disabled:opacity-50 active:scale-95 transition-transform"
            >
              {submitting ? "제출 중..." : "피드백 보내기 🚀"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSurveySubmit} className="space-y-5">
            {/* Week selector */}
            <div>
              <p className="text-sm font-semibold text-[#2D2D2D] mb-2">몇 주차 설문?</p>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSurveyWeek(w)}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${surveyWeek === w ? "bg-[#FF6B6B] text-white" : "bg-white border border-[#EAE0D8] text-[#8B7B72]"}`}
                  >
                    {w}주차
                  </button>
                ))}
              </div>
            </div>

            {/* Score questions */}
            {SURVEY_QUESTIONS.map((q, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-[#2D2D2D] mb-2">{i+1}. {q}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScores(prev => { const n = [...prev]; n[i] = s; return n; })}
                      className={`flex-1 aspect-square rounded-2xl text-lg font-bold transition-all ${
                        scores[i] === s ? "bg-[#FF6B6B] text-white" : "bg-white border border-[#EAE0D8] text-[#8B7B72]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-[#8B7B72] mt-1 px-1">
                  <span>별로예요</span><span>아주 좋아요!</span>
                </div>
              </div>
            ))}

            {/* Open ended */}
            <div>
              <p className="text-sm font-semibold text-[#2D2D2D] mb-2">자유롭게 한마디 (선택)</p>
              <textarea
                value={surveyText}
                onChange={e => setSurveyText(e.target.value)}
                placeholder="더 하고 싶은 말이 있다면..."
                className="w-full px-4 py-3 rounded-2xl border border-[#EAE0D8] bg-white text-sm text-[#2D2D2D] placeholder-[#C4B8B0] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/40"
                rows={3}
                maxLength={300}
              />
            </div>

            {/* Anonymous toggle */}
            <button
              type="button"
              onClick={() => setSurveyAnonymous(!surveyAnonymous)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl w-full text-sm ${surveyAnonymous ? "bg-[#FFE8E8] text-[#FF6B6B]" : "bg-[#F5EEE8] text-[#8B7B72]"}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${surveyAnonymous ? "bg-[#FF6B6B] border-[#FF6B6B]" : "border-[#C4B8B0]"}`}>
                {surveyAnonymous && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </span>
              <span className="font-medium">익명으로 제출하기</span>
            </button>

            <button
              type="submit"
              disabled={surveySubmitting || scores.some(s => s === 0)}
              className="w-full py-4 rounded-2xl bg-[#FF6B6B] text-white font-bold text-base disabled:opacity-50 active:scale-95 transition-transform"
            >
              {surveySubmitting ? "제출 중..." : "설문 제출하기 📊"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
