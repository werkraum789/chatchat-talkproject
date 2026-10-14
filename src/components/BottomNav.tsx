import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "홈", icon: "🏠" },
  { to: "/mission", label: "미션", icon: "🎯" },
  { to: "/records", label: "내 기록", icon: "📔" },
  { to: "/community", label: "커뮤니티", icon: "💬" },
  { to: "/feedback", label: "피드백", icon: "✍️" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#EAE0D8] safe-area-inset-bottom">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex-1 flex flex-col items-center py-2 gap-0.5"
            >
              <span className={`text-xl transition-transform ${active ? "scale-110" : "scale-100 opacity-50"}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-medium ${active ? "text-[#FF6B6B]" : "text-[#8B7B72]"}`}>
                {tab.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-[#FF6B6B]" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
