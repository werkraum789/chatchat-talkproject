import { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import {
  supabase,
  Entry,
  MOODS,
  WEEK_COLORS,
  ACTIVITY_DAY_OPTIONS,
  ActivityDay,
  Visibility,
  WeeklyActivities,
  createEmptyActivities,
} from "../lib/supabase";
import LoginModal from "../components/LoginModal";
import AnonymousComments from "../components/AnonymousComments";

const VISIBILITY_OPTS: { value: Visibility; label: string; desc: string }[] = [
  { value: "private", label: "🔒 나만 보기", desc: "나만 볼 수 있어요" },
  { value: "admin", label: "🛡 관리자에게 공유", desc: "관리자만 볼 수 있어요" },
  { value: "public", label: "🌍 모두에게 공유", desc: "커뮤니티에 공개돼요" },
];

export default function MyRecords() {
  const { user } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [activeWeek, setActiveWeek] = useState<1 | 2 | 3>(1);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activities, setActivities] = useState<WeeklyActivities>(createEmptyActivities);
  const [activeDay, setActiveDay] = useState<ActivityDay>("monday");
  const [loading, setLoading] = useState(true);

  // Form state
  const [isWriting, setIsWriting] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingActivityDay, setEditingActivityDay] = useState<ActivityDay | null>(null);

  async function loadEntries() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("week", activeWeek)
      .order("created_at", { ascending: false });
    const loadedEntries = (data || []) as Entry[];
    setEntries(loadedEntries);
    const nextActivities = createEmptyActivities();
    for (const entry of loadedEntries) {
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
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
  }, [user, activeWeek]);

  function selectWeek(week: 1 | 2 | 3) {
    setActiveWeek(week);
    setActivities(createEmptyActivities());
    setIsWriting(false);
    setEditingId(null);
    setEditingActivityDay(null);
    setSaveError("");
  }

  async function handleSave() {
    if (!user || !content.trim() || !mood) return;
    setSubmitting(true);
    setSaveError("");
    let savedEntryId = editingId;
    const payload = {
      content,
      mood,
      visibility,
      is_anonymous: isAnonymous,
      ...(editingActivityDay ? { image_url: `activity-day:${editingActivityDay}` } : {}),
    };
    const result = editingId
      ? await supabase.from("entries").update(payload).eq("id", editingId).select("id").single()
      : await supabase
          .from("entries")
          .insert({ user_id: user.id, week: activeWeek, ...payload })
          .select("id")
          .single();

    if (result.error || !result.data) {
      setSaveError("기록을 저장하지 못했어요. 다시 시도해 주세요.");
      setSubmitting(false);
      return;
    }
    savedEntryId = result.data.id;

    if (editingActivityDay) {
      const nextActivities: WeeklyActivities = {
        ...activities,
        [editingActivityDay]: {
          content,
          mood,
          visibility,
          entryId: savedEntryId,
        },
      };
      setActivities(nextActivities);
    }
    setContent(""); setMood(""); setVisibility("private"); setIsAnonymous(false);
    setIsWriting(false); setEditingId(null); setEditingActivityDay(null);
    setSubmitting(false);
    await loadEntries();
  }

  function openDayRecord(day: ActivityDay) {
    const activity = activities[day];
    setActiveDay(day);
    setEditingActivityDay(day);
    setEditingId(activity.entryId || null);
    setContent(activity.content);
    setMood(activity.mood);
    setVisibility(activity.visibility);
    setIsAnonymous(false);
    setSaveError("");
    setIsWriting(true);
  }

  function startEdit(entry: Entry) {
    const linkedDay = ACTIVITY_DAY_OPTIONS.find(({ key }) => activities[key].entryId === entry.id)?.key;
    setEditingId(entry.id);
    setEditingActivityDay(linkedDay || null);
    if (linkedDay) setActiveDay(linkedDay);
    setContent(entry.content);
    setMood(entry.mood);
    setVisibility(entry.visibility);
    setIsAnonymous(entry.is_anonymous);
    setIsWriting(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제할까요?")) return;
    await supabase.from("entries").delete().eq("id", id);
    const linkedDay = ACTIVITY_DAY_OPTIONS.find(({ key }) => activities[key].entryId === id)?.key;
    if (linkedDay) {
      const nextActivities: WeeklyActivities = {
        ...activities,
        [linkedDay]: { content: "", visibility: "private", mood: "" },
      };
      setActivities(nextActivities);
    }
    await loadEntries();
  }

  if (!user) return (
    <div className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center gap-4 pb-24 px-5">
      <div className="text-5xl">📔</div>
      <h2 className="font-display text-xl font-black text-[#2D2D2D]">내 기록</h2>
      <p className="text-sm text-[#8B7B72] text-center">로그인하면 나만의 일기장을 쓸 수 있어요!</p>
      <button onClick={() => setShowLogin(true)} className="px-6 py-3 rounded-2xl bg-[#FF6B6B] text-white font-bold">
        참여하기
      </button>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-24">
      <div className="px-5 pt-8 pb-4">
        <h1 className="font-display text-2xl font-black text-[#2D2D2D] mb-4">내 기록 📔</h1>

        {/* Week tabs */}
        <div className="flex gap-2 mb-4">
          {([1, 2, 3] as const).map(w => {
            const active = w === activeWeek;
            const c = WEEK_COLORS[w];
            return (
              <button
                key={w}
                onClick={() => selectWeek(w)}
                className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all"
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

        {/* Day tabs */}
        <div className="mb-4 grid grid-cols-7 gap-1.5">
          {ACTIVITY_DAY_OPTIONS.map(day => {
            const selected = activeDay === day.key;
            const hasRecord = Boolean(activities[day.key].content.trim());
            return (
              <button
                key={day.key}
                onClick={() => openDayRecord(day.key)}
                className={`relative rounded-2xl py-2.5 text-xs font-bold transition-all ${
                  selected ? "bg-primary text-white" : "bg-white text-subtext border border-border"
                }`}
              >
                {day.label}
                {hasRecord && (
                  <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${selected ? "bg-white" : "bg-primary"}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Write Button */}
        {!isWriting && (
          <button
            onClick={() => openDayRecord(activeDay)}
            className="w-full py-4 rounded-3xl border-2 border-dashed border-[#FF6B6B] text-[#FF6B6B] font-bold text-sm active:scale-95 transition-transform mb-4"
          >
            + {ACTIVITY_DAY_OPTIONS.find(day => day.key === activeDay)?.label}요일 기록 남기기
          </button>
        )}

        {/* Write Form */}
        {isWriting && (
          <div className="bg-white rounded-3xl p-4 border border-[#EAE0D8] mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-[#2D2D2D]">
                {editingId ? "기록 수정" : `${activeWeek}주차 ${ACTIVITY_DAY_OPTIONS.find(day => day.key === activeDay)?.label}요일 기록`}
              </h3>
              <button onClick={() => { setIsWriting(false); setEditingId(null); setEditingActivityDay(null); setContent(""); setMood(""); }}
                className="text-[#8B7B72] text-sm">취소</button>
            </div>

            {/* Mood */}
            <div className="mb-3">
              <p className="text-xs text-[#8B7B72] mb-2">오늘 기분은?</p>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`text-2xl transition-transform ${mood === m ? "scale-125" : "opacity-50"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="오늘 미션 어땠어요? 자유롭게 기록해봐요 ✍️"
              className="w-full px-3 py-3 rounded-2xl border border-[#EAE0D8] bg-[#FFF8F3] text-sm text-[#2D2D2D] placeholder-[#C4B8B0] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/40 mb-3"
              rows={4}
              maxLength={500}
            />

            {/* Visibility */}
            <div className="mb-3">
              <p className="text-xs text-[#8B7B72] mb-2">공개 범위</p>
              <div className="space-y-2">
                {VISIBILITY_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl border text-sm transition-all ${
                      visibility === opt.value ? "border-[#FF6B6B] bg-[#FFF8F3]" : "border-[#EAE0D8]"
                    }`}
                  >
                    <span className="font-medium text-[#2D2D2D]">{opt.label}</span>
                    <span className="text-[10px] text-[#8B7B72]">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Anonymous toggle (only for public) */}
            {visibility === "public" && (
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm mb-3 ${isAnonymous ? "bg-[#FFE8E8] text-[#FF6B6B]" : "bg-[#F5EEE8] text-[#8B7B72]"}`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isAnonymous ? "bg-[#FF6B6B] border-[#FF6B6B]" : "border-[#C4B8B0]"}`}>
                  {isAnonymous && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                익명으로 올리기
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={submitting || !content.trim() || !mood}
              className="w-full py-3.5 rounded-2xl bg-[#FF6B6B] text-white font-bold text-sm disabled:opacity-50"
            >
              {submitting ? "저장 중..." : "저장하기 💾"}
            </button>
            {saveError && <p className="mt-2 text-center text-xs font-medium text-primary">{saveError}</p>}
          </div>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="text-center py-10 text-[#8B7B72] text-sm">불러오는 중...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-sm text-[#8B7B72]">아직 기록이 없어요. 첫 기록을 남겨봐요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-3xl border border-[#EAE0D8] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{entry.mood}</span>
                      {ACTIVITY_DAY_OPTIONS.map(day => activities[day.key].entryId === entry.id ? (
                        <span key={day.key} className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                          {day.label}요일
                        </span>
                      ) : null)}
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] text-[#8B7B72] bg-[#F5EEE8] px-2 py-0.5 rounded-full">
                        {VISIBILITY_OPTS.find(v => v.value === entry.visibility)?.label}
                      </span>
                      {entry.is_anonymous && (
                        <span className="text-[10px] text-[#FF6B6B] bg-[#FFE8E8] px-2 py-0.5 rounded-full">익명</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[#2D2D2D] leading-relaxed mb-2">{entry.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8B7B72]">
                      {new Date(entry.created_at).toLocaleDateString("ko-KR")}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(entry)} className="text-[11px] text-[#8B7B72] underline">수정</button>
                      <button onClick={() => handleDelete(entry.id)} className="text-[11px] text-red-400 underline">삭제</button>
                    </div>
                  </div>
                </div>
                <AnonymousComments entryId={entry.id} canComment commenterId={user.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
