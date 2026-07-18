import { Routes, Route, NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Brain,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FolderGit2,
  Library,
  Upload,
} from "lucide-react";
import Dashboard from "./views/Dashboard";
import Chat from "./views/Chat";
import Notes from "./views/Notes";
import MemoryView from "./views/Memory";
import Projects from "./views/Projects";
import Knowledge from "./views/Knowledge";
import UploadManager from "./views/UploadManager";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/chat", label: "Chat", icon: MessageSquare, end: false },
  { to: "/notes", label: "Notes", icon: FileText, end: false },
  { to: "/memory", label: "Memory", icon: Brain, end: false },
  { to: "/projects", label: "Projects", icon: FolderGit2, end: false },
  { to: "/knowledge", label: "Knowledge", icon: Library, end: false },
];

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-j-bg text-j-text overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-j-surface border-r border-j-border flex-shrink-0
                    transition-[width] duration-200 ${collapsed ? "w-14" : "w-52"}`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 py-5 border-b border-j-border
                          ${collapsed ? "justify-center px-2" : "px-4"}`}
        >
          <div className="relative flex-shrink-0">
            <div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-j-cyan to-blue-600
                            flex items-center justify-center shadow-lg shadow-j-cyan/20"
            >
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div
              className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-j-emerald
                            rounded-full animate-pulse"
            />
          </div>
          {!collapsed && (
            <div>
              <p className="text-[11px] font-bold text-white tracking-[0.18em]">
                J.A.R.B.A.S.
              </p>
              <p className="text-[9px] text-j-cyan/50 tracking-widest mt-0.5">
                ONLINE
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 pt-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                 transition-all ${collapsed ? "justify-center" : ""}
                 ${
                   isActive
                     ? "bg-j-cyan/10 text-j-cyan border border-j-cyan/20"
                     : "text-j-muted hover:text-j-text hover:bg-j-hover border border-transparent"
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-j-cyan" : ""}`}
                  />
                  {!collapsed && label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-j-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg
                        text-j-muted hover:text-j-text hover:bg-j-hover
                        transition-all text-xs ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/memory" element={<MemoryView />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/UploadManager" element={<UploadManager />} />
        </Routes>
      </main>
    </div>
  );
}
