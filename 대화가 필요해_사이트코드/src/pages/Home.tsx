import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { supabase, Mission, MissionCompletion, Announcement, WEEK_COLORS } from "../lib/supabase";
import LoginModal from "../components/LoginModal";

const CURRENT_WEEK = 1;

export default function Home() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completions, setCompletions] = useState<MissionCompletion[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    supabase.from("missions").select("*").order("week").then(({ data }) => {
      if (data) setMissions(data as Mission[]);
    });
    supabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) setAnnouncement(data[0] as Announcement);
    });
    if (user) {
      supabase.from("mission_completions").select("*").eq("user_id", user.id).then(({ data }) => {
        if (data) setCompletions(data as MissionCompletion[]);
      });
    }
  }, [user]);

  const completedWeeks = completions.map(c => c.week);
  const progressPct = (completedWeeks.length / 3) * 100;
  const currentMission = missions.find(m => m.week === CURRENT_WEEK);

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-24">
      {/* Announcement Banner */}
      {announcement && (
        <div className="bg-[#FF6B6B] text-white text-sm px-4 py-3 text-center">
          📣 {announcement.content}
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black text-[#2D2D2D]">
              3주 미션 챌린지 🌟
            </h1>
            <p className="text-sm text-[#8B7B72] mt-0.5">
              {user ? `${user.nickname}님, 오늘도 화이팅!` : "함께 성장하는 3주간의 여정"}
            </p>
          </div>
          {user ? (
            <button
              onClick={() => navigate("/records")}
              className="w-10 h-10 rounded-full bg-[#FF6B6B] text-white text-lg flex items-center justify-center font-bold shadow-md"
            >
              {user.nickname[0]}
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 rounded-2xl bg-[#FF6B6B] text-white text-sm font-bold shadow-sm"
            >
              참여하기
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {user && (
        <div className="mx-5 mt-4 bg-white rounded-3xl p-4 shadow-sm border border-[#EAE0D8]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-[#2D2D2D]">내 진행도</span>
            <span className="text-sm text-[#8B7B72]">{completedWeeks.length}/3주 완료</span>
          </div>
          <div className="h-3 bg-[#F5EEE8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FFB347] rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-around mt-3">
            {[1, 2, 3].map(w => (
              <div key={w} className="flex flex-col items-center gap-1">
                <span className={`text-2xl ${completedWeeks.includes(w as 1|2|3) ? "" : "opacity-30"}`}>
                  {WEEK_COLORS[w as 1|2|3].badge}
                </span>
                <span className="text-[10px] text-[#8B7B72]">{w}주차</span>
              </div>
            ))}
          </div>
          {completedWeeks.length === 3 && (
            <button
              onClick={() => navigate("/complete")}
              className="mt-3 w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FFB347] text-white font-bold text-sm"
            >
              🎓 수료 화면 보기
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="mx-5 mt-5">
        <h2 className="font-display text-base font-bold text-[#2D2D2D] mb-3">3주 타임라인</h2>
        <div className="flex gap-3">
          {([1, 2, 3] as const).map(w => {
            const wc = WEEK_COLORS[w];
            const done = completedWeeks.includes(w);
            const mission = missions.find(m => m.week === w);
            return (
              <button
                key={w}
                onClick={() => navigate(`/mission/${w}`)}
                className="flex-1 rounded-3xl p-3 text-left transition-transform active:scale-95"
                style={{ backgroundColor: done ? wc.hex : wc.light, border: `2px solid ${wc.hex}` }}
              >
                <div className="text-2xl mb-1">{wc.badge}</div>
                <div className="text-xs font-bold" style={{ color: wc.hex.replace("B5", "2D").replace("C7", "4A").replace("FF", "B5") }}>
                  {w}주차
                </div>
                <div className="text-[10px] text-[#8B7B72] mt-0.5 leading-tight">
                  {mission?.title.slice(0, 10) || "로딩중..."}...
                </div>
                {done && <div className="text-[10px] font-bold text-green-600 mt-1">✓ 완료!</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Week Mission Card */}
      {currentMission && (
        <div className="mx-5 mt-5">
          <h2 className="font-display text-base font-bold text-[#2D2D2D] mb-3">이번 주 미션 🎯</h2>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EAE0D8]">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ backgroundColor: WEEK_COLORS[CURRENT_WEEK].light, color: "#FF6B6B" }}
            >
              {WEEK_COLORS[CURRENT_WEEK].badge} {CURRENT_WEEK}주차 미션
            </div>
            <h3 className="font-display text-lg font-black text-[#2D2D2D] mb-2">
              {currentMission.title}
            </h3>
            <p className="text-sm text-[#8B7B72] leading-relaxed">
              {currentMission.description.slice(0, 80)}...
            </p>
            <button
              onClick={() => navigate(`/mission/${CURRENT_WEEK}`)}
              className="mt-4 w-full py-3.5 rounded-2xl bg-[#FF6B6B] text-white font-bold text-sm active:scale-95 transition-transform"
            >
              미션 자세히 보기 →
            </button>
          </div>
        </div>
      )}

      {/* Big Record Button */}
      <div className="mx-5 mt-4">
        {user ? (
          <button
            onClick={() => navigate("/records")}
            className="w-full py-5 rounded-3xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] text-white shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">📝</div>
            <div className="font-display font-black text-lg">기록 남기기</div>
            <div className="text-sm opacity-80 mt-0.5">오늘의 미션 어땠어요?</div>
          </button>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            className="w-full py-5 rounded-3xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] text-white shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">🚀</div>
            <div className="font-display font-black text-lg">챌린지 참여하기</div>
            <div className="text-sm opacity-80 mt-0.5">닉네임 + 이메일로 바로 시작!</div>
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mx-5 mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 text-center border border-[#EAE0D8]">
          <div className="font-display text-xl font-black text-[#FF6B6B]">3주</div>
          <div className="text-[10px] text-[#8B7B72]">챌린지 기간</div>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-[#EAE0D8]">
          <div className="font-display text-xl font-black text-[#FF6B6B]">매일</div>
          <div className="text-[10px] text-[#8B7B72]">기록 가능</div>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-[#EAE0D8]">
          <div className="font-display text-xl font-black text-[#FF6B6B]">🏆</div>
          <div className="text-[10px] text-[#8B7B72]">수료 배지 획득</div>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
