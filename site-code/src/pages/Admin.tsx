import { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { supabase, User, Entry, Feedback, Announcement, SurveyResponse, MissionCompletion, WEEK_COLORS } from "../lib/supabase";
import AnonymousComments from "../components/AnonymousComments";

const ADMIN_PASSWORD = "challenge2024!";

type Tab = "dashboard" | "participants" | "records" | "feedback" | "surveys" | "announcements";

export default function Admin() {
  const { isAdmin, setIsAdmin } = useApp();
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem("challenge_admin", "1");
    } else {
      setAuthError("비밀번호가 틀렸어요.");
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🔐</div>
            <h1 className="font-display text-xl font-black text-[#2D2D2D]">관리자 로그인</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="관리자 비밀번호"
              className="w-full px-4 py-3 rounded-2xl border border-[#EAE0D8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/40"
            />
            {authError && <p className="text-sm text-red-500 text-center">{authError}</p>}
            <button type="submit" className="w-full py-4 rounded-2xl bg-[#FF6B6B] text-white font-bold">
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { setIsAdmin } = useApp();
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs: { value: Tab; label: string; icon: string }[] = [
    { value: "dashboard", label: "대시보드", icon: "📊" },
    { value: "participants", label: "참여자", icon: "👥" },
    { value: "records", label: "기록", icon: "📝" },
    { value: "feedback", label: "피드백", icon: "💬" },
    { value: "surveys", label: "설문", icon: "📋" },
    { value: "announcements", label: "공지", icon: "📣" },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-8">
      <div className="bg-white border-b border-[#EAE0D8] sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-display text-lg font-black text-[#2D2D2D]">🛡 관리자</h1>
          <button
            onClick={() => { setIsAdmin(false); localStorage.removeItem("challenge_admin"); }}
            className="text-xs text-[#8B7B72] underline"
          >
            로그아웃
          </button>
        </div>
        <div className="flex gap-1 px-3 pb-3 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                tab === t.value ? "bg-[#FF6B6B] text-white" : "bg-[#F5EEE8] text-[#8B7B72]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "participants" && <ParticipantsTab />}
        {tab === "records" && <RecordsTab />}
        {tab === "feedback" && <FeedbackTab />}
        {tab === "surveys" && <SurveysTab />}
        {tab === "announcements" && <AnnouncementsTab />}
      </div>
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState({ users: 0, entries: 0, feedback: 0, completions: [0,0,0] });

  useEffect(() => {
    async function load() {
      const [usersRes, entriesRes, feedbackRes, completionsRes] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("entries").select("id", { count: "exact", head: true }),
        supabase.from("feedback").select("id", { count: "exact", head: true }),
        supabase.from("mission_completions").select("week"),
      ]);
      const completions = [1,2,3].map(w => (completionsRes.data || []).filter((c: any) => c.week === w).length);
      setStats({
        users: usersRes.count || 0,
        entries: entriesRes.count || 0,
        feedback: feedbackRes.count || 0,
        completions,
      });
    }
    load();
  }, []);

  const totalUsers = stats.users || 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "전체 참여자", value: stats.users, icon: "👥" },
          { label: "전체 기록", value: stats.entries, icon: "📝" },
          { label: "피드백", value: stats.feedback, icon: "💬" },
          { label: "완료율", value: `${Math.round((stats.completions.reduce((a,b)=>a+b,0) / (totalUsers * 3)) * 100)}%`, icon: "🏆" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#EAE0D8] text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-display text-2xl font-black text-[#FF6B6B]">{s.value}</div>
            <div className="text-xs text-[#8B7B72]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#EAE0D8]">
        <h3 className="font-bold text-sm text-[#2D2D2D] mb-3">주차별 완료율</h3>
        {[1,2,3].map(w => {
          const count = stats.completions[w-1];
          const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
          const wc = WEEK_COLORS[w as 1|2|3];
          return (
            <div key={w} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span>{wc.badge} {w}주차</span>
                <span className="text-[#8B7B72]">{count}명 / {pct}%</span>
              </div>
              <div className="h-2 bg-[#F5EEE8] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: wc.hex }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ParticipantsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [completions, setCompletions] = useState<MissionCompletion[]>([]);

  useEffect(() => {
    supabase.from("users").select("*").order("created_at", { ascending: false }).then(({ data }) => setUsers((data || []) as User[]));
    supabase.from("mission_completions").select("*").then(({ data }) => setCompletions((data || []) as MissionCompletion[]));
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#8B7B72]">총 {users.length}명</p>
      {users.map(u => {
        const userCompletions = completions.filter(c => c.user_id === u.id).map(c => c.week);
        return (
          <div key={u.id} className="bg-white rounded-2xl p-3 border border-[#EAE0D8]">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-bold text-sm text-[#2D2D2D]">{u.nickname}</span>
                <span className="text-xs text-[#8B7B72] ml-1">{u.email}</span>
              </div>
              <span className="text-xs text-[#8B7B72]">{new Date(u.created_at).toLocaleDateString("ko-KR")}</span>
            </div>
            <div className="flex gap-1">
              {[1,2,3].map(w => {
                const done = userCompletions.includes(w as 1|2|3);
                return (
                  <span key={w} className={`text-xs px-2 py-0.5 rounded-full ${done ? "bg-green-100 text-green-700" : "bg-[#F5EEE8] text-[#8B7B72]"}`}>
                    {WEEK_COLORS[w as 1|2|3].badge} {w}주{done ? "✓" : ""}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecordsTab() {
  const { user } = useApp();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [weekFilter, setWeekFilter] = useState<0|1|2|3>(0);
  const [visFilter, setVisFilter] = useState<"all"|"admin"|"public">("all");

  async function load() {
    let q = supabase
      .from("entries")
      .select("*, users(nickname)")
      .in("visibility", ["admin", "public"])
      .order("created_at", { ascending: false });
    if (weekFilter !== 0) q = q.eq("week", weekFilter);
    if (visFilter !== "all") q = q.eq("visibility", visFilter);
    const { data } = await q;
    setEntries((data || []) as Entry[]);
  }

  useEffect(() => { load(); }, [weekFilter, visFilter]);

  async function toggleHide(entry: Entry) {
    await supabase.from("entries").update({ is_hidden: !entry.is_hidden }).eq("id", entry.id);
    await load();
  }

  async function deleteEntry(id: string) {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("entries").delete().eq("id", id);
    await load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {[0,1,2,3].map(w => (
          <button key={w} onClick={() => setWeekFilter(w as 0|1|2|3)}
            className={`px-2 py-1 rounded-xl text-xs font-bold ${weekFilter === w ? "bg-[#FF6B6B] text-white" : "bg-[#F5EEE8] text-[#8B7B72]"}`}>
            {w === 0 ? "전체" : `${w}주차`}
          </button>
        ))}
        {(["all","admin","public"] as const).map(v => (
          <button key={v} onClick={() => setVisFilter(v)}
            className={`px-2 py-1 rounded-xl text-xs font-bold ${visFilter === v ? "bg-[#2D2D2D] text-white" : "bg-[#F5EEE8] text-[#8B7B72]"}`}>
            {v === "all" ? "공개범위 전체" : v}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {entries.map(e => {
          const user = (e as any).users;
          return (
            <div key={e.id} className={`bg-white rounded-2xl border overflow-hidden ${e.is_hidden ? "border-red-200 opacity-60" : "border-[#EAE0D8]"}`}>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap mb-1">
                      <span className="text-xs font-bold text-[#2D2D2D]">{user?.nickname || "??"}</span>
                      {e.is_anonymous && <span className="text-[10px] text-[#FF6B6B] bg-[#FFE8E8] px-1.5 rounded-full">익명</span>}
                      <span className="text-[10px] text-[#8B7B72]">· {e.week}주차 · {e.visibility} · {e.mood}</span>
                    </div>
                    <p className="text-xs text-[#2D2D2D] line-clamp-2">{e.content}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => toggleHide(e)} className={`text-xs px-2 py-1 rounded-xl ${e.is_hidden ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {e.is_hidden ? "복원" : "숨김"}
                    </button>
                    <button onClick={() => deleteEntry(e.id)} className="text-xs px-2 py-1 rounded-xl bg-red-100 text-red-600">삭제</button>
                  </div>
                </div>
              </div>
              <AnonymousComments
                entryId={e.id}
                canComment
                commenterId={user?.id}
                allowAdminFallback
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackTab() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    supabase.from("feedback").select("*, users(nickname)").order("created_at", { ascending: false }).then(({ data }) => setFeedbacks((data || []) as Feedback[]));
  }, []);

  const CATEGORY_LABELS = { mission: "🎯 미션", process: "⚙️ 진행", other: "💡 기타" };

  return (
    <div className="space-y-2">
      {feedbacks.map(f => (
        <div key={f.id} className="bg-white rounded-2xl p-3 border border-[#EAE0D8]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#FF6B6B]">{CATEGORY_LABELS[f.category]}</span>
            {f.is_anonymous ? <span className="text-[10px] text-[#8B7B72]">익명</span> : <span className="text-[10px] text-[#8B7B72]">{(f as any).users?.nickname || "?"}</span>}
            <span className="text-[10px] text-[#8B7B72] ml-auto">{new Date(f.created_at).toLocaleDateString("ko-KR")}</span>
          </div>
          <p className="text-xs text-[#2D2D2D]">{f.content}</p>
        </div>
      ))}
      {feedbacks.length === 0 && <p className="text-center text-sm text-[#8B7B72] py-10">피드백이 없어요</p>}
    </div>
  );
}

function SurveysTab() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [weekFilter, setWeekFilter] = useState<1|2|3>(1);

  useEffect(() => {
    supabase.from("survey_responses").select("*").eq("week", weekFilter).then(({ data }) => setResponses((data || []) as SurveyResponse[]));
  }, [weekFilter]);

  const avgScore = (scores: (number|null)[]) => {
    const valid = scores.filter(Boolean) as number[];
    return valid.length ? (valid.reduce((a,b)=>a+b,0)/valid.length).toFixed(1) : "-";
  };

  const q1Avg = avgScore(responses.map(r => r.q1_score));
  const q2Avg = avgScore(responses.map(r => r.q2_score));
  const q3Avg = avgScore(responses.map(r => r.q3_score));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {([1,2,3] as const).map(w => (
          <button key={w} onClick={() => setWeekFilter(w)}
            className={`flex-1 py-2 rounded-2xl text-sm font-bold ${weekFilter === w ? "bg-[#FF6B6B] text-white" : "bg-[#F5EEE8] text-[#8B7B72]"}`}>
            {w}주차
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[["Q1 평균", q1Avg], ["Q2 평균", q2Avg], ["Q3 평균", q3Avg]].map(([label, val]) => (
          <div key={label as string} className="bg-white rounded-2xl p-3 border border-[#EAE0D8] text-center">
            <div className="font-display text-xl font-black text-[#FF6B6B]">{val}</div>
            <div className="text-[10px] text-[#8B7B72]">{label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {responses.map(r => (
          <div key={r.id} className="bg-white rounded-2xl p-3 border border-[#EAE0D8] text-xs">
            <div className="flex gap-2 mb-1">
              <span className="text-[#8B7B72]">Q1: {r.q1_score}점</span>
              <span className="text-[#8B7B72]">Q2: {r.q2_score}점</span>
              <span className="text-[#8B7B72]">Q3: {r.q3_score}점</span>
              {r.is_anonymous && <span className="text-[#FF6B6B]">익명</span>}
            </div>
            {r.q_text && <p className="text-[#2D2D2D]">"{r.q_text}"</p>}
          </div>
        ))}
        {responses.length === 0 && <p className="text-center text-sm text-[#8B7B72] py-10">응답이 없어요</p>}
      </div>
    </div>
  );
}

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements((data || []) as Announcement[]);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    await supabase.from("announcements").insert({ content });
    setContent("");
    setSaving(false);
    await load();
  }

  async function toggleActive(a: Announcement) {
    await supabase.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id);
    await load();
  }

  async function deleteAnn(id: string) {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    await load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 border border-[#EAE0D8]">
        <h3 className="font-bold text-sm text-[#2D2D2D] mb-2">새 공지 작성</h3>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="홈 상단 배너에 표시될 공지를 작성하세요"
          className="w-full px-3 py-2 rounded-xl border border-[#EAE0D8] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/40 mb-2"
          rows={2}
        />
        <button type="submit" disabled={saving || !content.trim()} className="w-full py-2.5 rounded-xl bg-[#FF6B6B] text-white font-bold text-sm disabled:opacity-50">
          {saving ? "저장 중..." : "공지 올리기 📣"}
        </button>
      </form>

      <div className="space-y-2">
        {announcements.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl p-3 border ${a.is_active ? "border-[#FF6B6B]" : "border-[#EAE0D8] opacity-60"}`}>
            <p className="text-sm text-[#2D2D2D] mb-2">{a.content}</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8B7B72]">{new Date(a.created_at).toLocaleDateString("ko-KR")}</span>
              <button onClick={() => toggleActive(a)} className={`ml-auto text-xs px-2 py-1 rounded-xl ${a.is_active ? "bg-green-100 text-green-700" : "bg-[#F5EEE8] text-[#8B7B72]"}`}>
                {a.is_active ? "활성" : "비활성"}
              </button>
              <button onClick={() => deleteAnn(a.id)} className="text-xs px-2 py-1 rounded-xl bg-red-100 text-red-600">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
