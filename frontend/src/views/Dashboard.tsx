import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  chatAPI,
  notesAPI,
  memoryAPI,
  projectsAPI,
  knowledgeAPI,
} from "../api/client";
import type { Conversation, Note, Memory, Project, Knowledge } from "../types";
import {
  MessageSquare,
  FileText,
  Brain,
  Clock,
  ArrowRight,
  FolderGit2,
  Library,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const nav = useNavigate();

  //  Estados para armazenar os dados de cada módulo 
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);

  //  Busca inicial unificada e Blindada 
  useEffect(() => {
    //  executa todas as requisições juntas.
    //  garante que, se o backend estiver desligado, ele retorne um objeto vazio sem quebrar o app.
    Promise.all([
      chatAPI.getConversations().catch(() => ({ data: [] })),
      notesAPI.getAll().catch(() => ({ data: [] })),
      memoryAPI.getAll().catch(() => ({ data: [] })),
      projectsAPI.getAll().catch(() => ({ data: [] })),
      knowledgeAPI.getAll().catch(() => ({ data: [] })),
    ])
      .then(([c, n, m, p, k]) => {
        //  Valida se o que o backend mandou é realmente uma Lista (Array)
        //  Evita o erro "map is not a function" caso venha um HTML de erro (String)
        const safeConversations = Array.isArray(c.data) ? c.data : [];
        const safeNotes = Array.isArray(n.data) ? n.data : [];
        const safeMemories = Array.isArray(m.data) ? m.data : [];
        const safeProjects = Array.isArray(p.data) ? p.data : [];
        const safeKnowledge = Array.isArray(k.data) ? k.data : [];

        // Corta as listas para exibir apenas os 4 itens mais recentes
        setConversations(safeConversations.slice(0, 4));
        setNotes(safeNotes.slice(0, 4));
        setMemories(safeMemories.slice(0, 4));
        setProjects(safeProjects.slice(0, 4));
        setKnowledge(safeKnowledge.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  const Skeleton = () => (
    <div className="h-12 bg-j-hover rounded-lg animate-pulse" />
  );

  return (
    <div className="h-full overflow-y-auto p-6 max-w-6xl mx-auto">
      {/* Cabeçalho  */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 bg-j-emerald rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-j-emerald/70 tracking-widest uppercase">
            System Status: Operação Defensiva Ativada
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Centro de Comando</h1>
        <p className="text-j-muted text-sm mt-1">
          J.A.R.B.A.S. · Inteligência Operacional Pessoal
        </p>
      </div>

      {/* Cartões de Estatísticas  */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          {
            label: "Conversas",
            count: conversations.length,
            icon: MessageSquare,
            bg: "bg-j-cyan/10",
            text: "text-j-cyan",
          },
          {
            label: "Notas",
            count: notes.length,
            icon: FileText,
            bg: "bg-j-violet/10",
            text: "text-j-violet",
          },
          {
            label: "Memórias",
            count: memories.length,
            icon: Brain,
            bg: "bg-j-emerald/10",
            text: "text-j-emerald",
          },
          {
            label: "Projetos",
            count: projects.length,
            icon: FolderGit2,
            bg: "bg-blue-500/10",
            text: "text-blue-400",
          },
          {
            label: "Cofre",
            count: knowledge.length,
            icon: Library,
            bg: "bg-j-amber/10",
            text: "text-j-amber",
          },
        ].map(({ label, count, icon: Icon, bg, text }) => (
          <div
            key={label}
            className="bg-j-card border border-j-border rounded-xl p-4"
          >
            <div
              className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}
            >
              <Icon className={`w-4 h-4 ${text}`} />
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">
              {loading ? "—" : count}
            </div>
            <div className="text-[11px] text-j-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Grade Principal de Painéis  */}
      <div className="grid grid-cols-2 gap-4">
        <Panel
          title="Projetos Ativos"
          icon={<FolderGit2 className="w-3.5 h-3.5 text-blue-400" />}
          action="Ver Projetos"
          onAction={() => nav("/projects")}
        >
          {loading ? (
            <div className="space-y-2">
              <Skeleton />
              <Skeleton />
            </div>
          ) : projects.length === 0 ? (
            <Empty
              icon={<FolderGit2 className="w-6 h-6" />}
              label="Nenhum projeto encontrado"
            />
          ) : (
            projects.map((p) => (
              <ItemRow
                key={p.id}
                title={p.name}
                sub={p.status === "active" ? "Em andamento" : p.status}
                subColor={
                  p.status === "active" ? "text-j-emerald/70" : "text-j-muted"
                }
                onClick={() => nav("/projects")}
              />
            ))
          )}
        </Panel>

        <Panel
          title="Cofre de Conhecimento"
          icon={<Library className="w-3.5 h-3.5 text-j-amber" />}
          action="Acessar Cofre"
          onAction={() => nav("/knowledge")}
        >
          {loading ? (
            <div className="space-y-2">
              <Skeleton />
              <Skeleton />
            </div>
          ) : knowledge.length === 0 ? (
            <Empty icon={<Library className="w-6 h-6" />} label="Cofre vazio" />
          ) : (
            knowledge.map((k) => (
              <ItemRow
                key={k.id}
                title={k.title}
                sub={k.category}
                subColor="text-j-amber/60"
                onClick={() => nav("/knowledge")}
              />
            ))
          )}
        </Panel>

        <Panel
          title="Conversas Recentes"
          icon={<MessageSquare className="w-3.5 h-3.5 text-j-cyan" />}
          action="Abrir Chat"
          onAction={() => nav("/chat")}
        >
          {loading ? (
            <div className="space-y-2">
              <Skeleton />
            </div>
          ) : conversations.length === 0 ? (
            <Empty
              icon={<MessageSquare className="w-5 h-5" />}
              label="Sem conversas"
            />
          ) : (
            conversations
              .slice(0, 2)
              .map((c) => (
                <ItemRow
                  key={c.id}
                  title={c.title}
                  sub={formatDistanceToNow(new Date(c.updated_at), {
                    addSuffix: true,
                  })}
                  onClick={() => nav("/chat")}
                />
              ))
          )}
        </Panel>

        <Panel
          title="Anotações Recentes"
          icon={<FileText className="w-3.5 h-3.5 text-j-violet" />}
          action="Abrir Notas"
          onAction={() => nav("/notes")}
        >
          {loading ? (
            <div className="space-y-2">
              <Skeleton />
            </div>
          ) : notes.length === 0 ? (
            <Empty
              icon={<FileText className="w-5 h-5" />}
              label="Sem anotações"
            />
          ) : (
            notes
              .slice(0, 2)
              .map((n) => (
                <ItemRow
                  key={n.id}
                  title={n.title}
                  sub={n.tags ? `#${n.tags.split(",")[0].trim()}` : n.category}
                  subColor="text-j-violet/60"
                  onClick={() => nav("/notes")}
                />
              ))
          )}
        </Panel>
      </div>
    </div>
  );
}

/* Sub-componentes Reutilizáveis  */

function Panel({
  title,
  icon,
  action,
  onAction,
  children,
}: {
  title: string;
  icon: ReactNode;
  action: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <div className="bg-j-card border border-j-border rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <button
          onClick={onAction}
          className="text-xs text-j-muted hover:text-j-text flex items-center gap-1 transition-colors"
        >
          {action}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-1.5 flex-1">{children}</div>
    </div>
  );
}

function ItemRow({
  title,
  sub,
  subColor = "text-j-muted",
  onClick,
}: {
  title: string;
  sub: string;
  subColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg bg-j-hover hover:bg-j-border
                 border border-transparent hover:border-j-border transition-all group"
    >
      <div className="text-xs text-j-text group-hover:text-white truncate transition-colors">
        {title}
      </div>
      <div className={`text-[10px] ${subColor} mt-0.5 flex items-center gap-1`}>
        <Clock className="w-2.5 h-2.5" />
        {sub}
      </div>
    </button>
  );
}

function Empty({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-j-dim h-full">
      {icon}
      <p className="text-xs mt-2">{label}</p>
    </div>
  );
}
