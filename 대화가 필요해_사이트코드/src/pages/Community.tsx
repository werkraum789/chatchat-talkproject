import { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { supabase, Entry, Reaction, WEEK_COLORS, getAnonymousNickname } from "../lib/supabase";
import LoginModal from "../components/LoginModal";
import AnonymousComments from "../components/AnonymousComments";

type EntryWithMeta = Entry & {
  users?: { nickname: string };
  reactions?: Reaction[];
  reactionCounts?: { like: number; heart: number; clap: number };
  myReactions?: string[];
};

const REACTION_ICONS = { like: "👍", heart: "❤️", clap: "👏" } as const;

export default function Community() {
  const { user } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [activeWeek, setActiveWeek] = useState<0 | 1 | 2 | 3>(0); // 0 = all
  const [entries, setEntries] = useState<EntryWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEntries() {
    setLoading(true);
    let q = supabase
      .from("entries")
      .select("*, users(nickname)")
      .eq("visibility", "public")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });
    if (activeWeek !== 0) q = q.eq("week", activeWeek);
    const { data: entryData } = await q;
    if (!entryData) { setLoading(false); return; }

    // Load reactions
    const ids = entryData.map((e: any) => e.id);
    const { data: reactions } = ids.length > 0 ? await supabase.from("reactions").select("*").in("entry_id", ids) : { data: [] };
    const enriched = entryData.map((e: any) => {
      const rList = (reactions || []).filter((r: any) => r.entry_id === e.id);
      const myR = user ? rList.filter((r: any) => r.user_id === user.id).map((r: any) => r.type) : [];
      return {
        ...e,
        reactions: rList,
        reactionCounts: {
          like: rList.filter((r: any) => r.type === "like").length,
          heart: rList.filter((r: any) => r.type === "heart").length,
          clap: rList.filter((r: any) => r.type === "clap").length,
        },
        myReactions: myR,
      };
    });
    setEntries(enriched as EntryWithMeta[]);
    setLoading(false);
  }

  useEffect(() => { loadEntries(); }, [activeWeek, user]);

  async function toggleReaction(entryId: string, type: "like" | "heart" | "clap") {
    if (!user) { setShowLogin(true); return; }
    const entry = entries.find(e => e.id === entryId);
    const alreadyReacted = entry?.myReactions?.includes(type);
    if (alreadyReacted) {
      await supabase.from("reactions").delete().eq("entry_id", entryId).eq("user_id", user.id).eq("type", type);
    } else {
      await supabase.from("reactions").upsert({ entry_id: entryId, user_id: user.id, type }, { onConflict: "entry_id,user_id,type" });
    }
    await loadEntries();
  }

  function getDisplayName(entry: EntryWithMeta) {
    if (entry.is_anonymous) return getAnonymousNickname(entry.user_id);
    return entry.users?.nickname || "참가자";
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-24">
      <div className="px-5 pt-8 pb-4">
        <h1 className="font-display text-2xl font-black text-[#2D2D2D] mb-4">커뮤니티 💬</h1>

        {/* Week Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { value: 0, label: "전체", icon: "✨" },
            { value: 1, label: "1주차", icon: WEEK_COLORS[1].badge },
            { value: 2, label: "2주차", icon: WEEK_COLORS[2].badge },
            { value: 3, label: "3주차", icon: WEEK_COLORS[3].badge },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setActiveWeek(f.value as 0 | 1 | 2 | 3)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                activeWeek === f.value ? "bg-[#FF6B6B] text-white" : "bg-[#F5EEE8] text-[#8B7B72]"
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#8B7B72] text-sm">불러오는 중...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-2">💭</div>
            <p className="text-sm text-[#8B7B72]">아직 공유된 글이 없어요.</p>
            <p className="text-xs text-[#8B7B72] mt-1">기록할 때 "모두에게 공유"를 선택해봐요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => {
              const wc = WEEK_COLORS[entry.week];
              return (
                <div key={entry.id} className="bg-white rounded-3xl border border-[#EAE0D8] overflow-hidden">
                  {/* Card Header */}
                  <div className="p-4 pb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: wc.light }}>
                        {entry.mood}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#2D2D2D]">{getDisplayName(entry)}</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: wc.light, color: "#2D2D2D" }}>
                            {wc.badge} {entry.week}주차
                          </span>
                          <span className="text-[10px] text-[#8B7B72]">
                            {new Date(entry.created_at).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#2D2D2D] leading-relaxed">{entry.content}</p>
                  </div>

                  {/* Reactions */}
                  <div className="px-4 py-2 flex gap-2 border-t border-[#F5EEE8]">
                    {(["like", "heart", "clap"] as const).map(type => {
                      const active = entry.myReactions?.includes(type);
                      const count = entry.reactionCounts?.[type] || 0;
                      return (
                        <button
                          key={type}
                          onClick={() => toggleReaction(entry.id, type)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all active:scale-90 ${
                            active ? "bg-[#FFE8E8]" : "bg-[#F5EEE8]"
                          }`}
                        >
                          <span>{REACTION_ICONS[type]}</span>
                          {count > 0 && <span className="text-xs text-[#8B7B72]">{count}</span>}
                        </button>
                      );
                    })}
                    <span className="ml-auto rounded-full bg-[#F5EEE8] px-2.5 py-1 text-xs text-[#8B7B72]">댓글은 모두 익명</span>
                  </div>

                  <AnonymousComments
                    entryId={entry.id}
                    canComment={Boolean(user)}
                    commenterId={user?.id}
                    onRequireLogin={() => setShowLogin(true)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
