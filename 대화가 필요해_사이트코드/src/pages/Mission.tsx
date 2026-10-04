import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import {
  supabase,
  Entry,
  Mission,
  MissionCompletion,
  ACTIVITY_DAY_OPTIONS,
  ActivityDay,
  WeeklyActivities,
  createEmptyActivities,
  WEEK_COLORS,
} from "../lib/supabase";
import LoginModal from "../components/LoginModal";

export default function MissionPage() {
  const { week: weekParam } = useParams<{ week: string }>();
  const week = (parseInt(weekParam || "1") as 1 | 2 | 3) || 1;
  const { user } = useApp();
  const navigate = useNavigate();
  const wc = WEEK_COLORS[week];

  const [mission, setMission] = useState<Mission | null>(null);
  const [completion, setCompletion] = useState<MissionCompletion | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activities, setActivities] = useState<WeeklyActivities>(createEmptyActivities);
  const [savingActivities, setSavingActivities] = useState(false);
  const [activitySaveStatus, setActivitySaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [showLogin, setShowLogin] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.from("missions").select("*").eq("week", week).single().then(({ data }) => {
      if (data) setMission(data as Mission);
    });
    if (user) {
      supabase.from("mission_completions").select("*").eq("user_id", user.id).eq("week", week).maybeSingle().then(({ data }) => {
        if (data) { setCompletion(data as MissionCompletion); setDone(true); }
      });
      supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("week", week)
        .like("image_url", "activity-day:%")
        .then(({ data }) => {
          const nextActivities = createEmptyActivities();
          for (const entry of (data || []) as Entry[]) {
            const day = entry.image_url?.replace("activity-day:", "") as ActivityDay;
            if (!ACTIVITY_DAY_OPTIONS.some(option => option.key === day)) continue;
            nextActivities[day] = {
              content: entry.content,
              visibility: entry.visibility,
              mood: entry.mood,
              entryId: entry.id,
            };
          }
          setActivities(nextActivities);
        });
    }
    setActivities(createEmptyActivities());
    setActivitySaveStatus("idle");
  }, [week, user]);

  function updateActivity(day: ActivityDay, value: string) {
    setActivities(current => ({
      ...current,
      [day]: { ...current[day], content: value },
    }));
    setActivitySaveStatus("idle");
  }

  async function handleSaveActivities() {
    if (!user) { setShowLogin(true); return; }
    setSavingActivities(true);
    setActivitySaveStatus("idle");
    try {
      const syncedActivities: WeeklyActivities = Object.fromEntries(
        ACTIVITY_DAY_OPTIONS.map(({ key }) => [key, { ...activities[key] }]),
      ) as WeeklyActivities;
      for (const { key } of ACTIVITY_DAY_OPTIONS) {
        const activity = syncedActivities[key];
        if (activity.entryId && !activity.content.trim()) {
          const { error } = await supabase
            .from("entries")
            .delete()
            .eq("id", activity.entryId)
            .eq("user_id", user.id);
          if (error) throw error;
          activity.entryId = undefined;
          continue;
        }
        if (activity.entryId) {
          const { error } = await supabase
            .from("entries")
            .update({ content: activity.content, image_url: `activity-day:${key}` })
            .eq("id", activity.entryId)
            .eq("user_id", user.id);
          if (error) throw error;
          continue;
        }
        if (activity.content.trim()) {
          const { data, error } = await supabase
            .from("entries")
            .insert({
              user_id: user.id,
              week,
              content: activity.content,
              mood: "😐",
              visibility: "private",
              is_anonymous: false,
              image_url: `activity-day:${key}`,
            })
            .select("id")
            .single();
          if (error || !data) throw error || new Error("Failed to create entry");
          activity.entryId = data.id;
          activity.mood = "😐";
        }
      }
      setActivities(syncedActivities);
      setActivitySaveStatus("saved");
    } catch {
      setActivitySaveStatus("error");
    }
    setSavingActivities(false);
  }

  async function handleComplete() {
    if (!user) { setShowLogin(true); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("mission_completions").upsert(
      { user_id: user.id, week, comment: comment || null },
      { onConflict: "user_id,week" }
    ).select().single();
    if (!error && data) {
      setCompletion(data as MissionCompletion);
      setDone(true);
    }
    setSubmitting(false);
  }

  const weekBg = { 1: "#E8F8F2", 2: "#EDEEF8", 3: "#FFF3EC" }[week];
  const weekBorder = { 1: "#B5EAD7", 2: "#C7CEEA", 3: "#FFDAC1" }[week];

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-24">
      {/* Week Selector */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="font-display text-2xl font-black text-[#2D2D2D] mb-4">미션 📋</h1>
        <div className="flex gap-2">
          {([1, 2, 3] as const).map(w => {
            const active = w === week;
            const c = WEEK_COLORS[w];
            return (
              <button
                key={w}
                onClick={() => navigate(`/mission/${w}`)}
                className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: active ? c.hex : "#F5EEE8",
                  color: active ? "#2D2D2D" : "#8B7B72",
                  border: `2px solid ${active ? c.hex : "transparent"}`,
                }}
              >
                {c.badge} {w}주차
              </button>
            );
          })}
        </div>
      </div>

      {mission ? (
        <div className="px-5 space-y-4">
          {/* Mission Card */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: weekBg, border: `2px solid ${weekBorder}` }}>
            <div className="text-4xl mb-3">{wc.badge}</div>
            <div className="text-xs font-bold text-[#8B7B72] mb-1">{week}주차 미션</div>
            <h2 className="font-display text-xl font-black text-[#2D2D2D] mb-3">{mission.title}</h2>
            <p className="text-sm text-[#2D2D2D] leading-relaxed">{mission.description}</p>
          </div>

          {/* Weekday activity log */}
          <div className="bg-white rounded-3xl p-4 border border-border">
            <div className="mb-4">
              <h3 className="font-bold text-sm text-text">이번 주 활동 기록</h3>
              <p className="mt-1 text-xs text-subtext">월요일부터 일요일까지, 실천한 내용을 짧게 남겨보세요.</p>
            </div>
            <div className="space-y-2.5">
              {ACTIVITY_DAY_OPTIONS.map(day => (
                <label key={day.key} className="flex items-start gap-3">
                  <span className={`mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${day.color}`}>
                    {day.label}
                  </span>
                  <textarea
                    value={activities[day.key].content}
                    onChange={event => updateActivity(day.key, event.target.value)}
                    placeholder={`${day.label}요일 활동 내용을 기록해 주세요`}
                    rows={2}
                    maxLength={500}
                    className="min-h-16 w-full resize-none rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-text placeholder:text-subtext/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </label>
              ))}
            </div>
            <button
              onClick={handleSaveActivities}
              disabled={savingActivities}
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
            >
              {savingActivities ? "저장 중..." : "이번 주 활동 저장하기"}
            </button>
            {activitySaveStatus === "saved" && (
              <p className="mt-2 text-center text-xs font-medium text-mint-dark">활동 기록을 저장했어요.</p>
            )}
            {activitySaveStatus === "error" && (
              <p className="mt-2 text-center text-xs font-medium text-primary">저장하지 못했어요. 잠시 후 다시 시도해 주세요.</p>
            )}
          </div>

          {/* Complete Mission */}
          <div className="bg-white rounded-3xl p-4 border border-[#EAE0D8]">
            <h3 className="font-bold text-sm text-[#2D2D2D] mb-3">
              {done ? "✅ 미션 완료!" : "미션 완료 체크"}
            </h3>
            {done ? (
              <div className="text-center py-3">
                <div className="text-4xl mb-2">{wc.badge}</div>
                <div className="font-display font-black text-[#FF6B6B] text-lg">{week}주차 배지 획득!</div>
                {completion?.comment && (
                  <p className="text-sm text-[#8B7B72] mt-2 bg-[#FFF8F3] rounded-2xl px-3 py-2">
                    "{completion.comment}"
                  </p>
                )}
                <button
                  onClick={() => navigate("/records")}
                  className="mt-3 w-full py-3 rounded-2xl bg-[#FFF8F3] border border-[#EAE0D8] text-sm font-bold text-[#2D2D2D]"
                >
                  기록 남기러 가기 📝
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="한 줄 소감을 남겨봐요! (선택)"
                  className="w-full px-3 py-3 rounded-2xl border border-[#EAE0D8] bg-[#FFF8F3] text-sm text-[#2D2D2D] placeholder-[#C4B8B0] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/40 mb-3"
                  rows={2}
                  maxLength={100}
                />
                <button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl font-bold text-sm text-white active:scale-95 transition-transform disabled:opacity-50"
                  style={{ backgroundColor: wc.hex.replace("B5", "2D").replace("C7", "4A").replace("FF", "B5") }}
                >
                  {submitting ? "저장 중..." : `✅ ${week}주차 미션 완료했어요!`}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-20">
          <div className="text-[#8B7B72] text-sm">로딩 중...</div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
