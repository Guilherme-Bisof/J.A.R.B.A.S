import { useEffect, useState } from "react";
import { memoryAPI } from "../api/client";
import { useStore } from "../store/useStore";
import type { Memory } from "../types";
import { Plus, Trash2, Brain, Edit2, Save, X, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CATS = [
  "all",
  "preference",
  "fact",
  "skill",
  "decision",
  "personal",
  "general",
] as const;
const CAT_STYLE: Record<string, string> = {
  preference: "text-j-amber  bg-j-amber/10  border-j-amber/25",
  fact: "text-j-cyan   bg-j-cyan/10   border-j-cyan/25",
  skill: "text-j-violet bg-j-violet/10 border-j-violet/25",
  decision: "text-j-red    bg-j-red/10    border-j-red/25",
  personal: "text-j-emerald bg-j-emerald/10 border-j-emerald/25",
  general: "text-j-muted  bg-j-hover      border-j-border",
};

// Atualizado para refletir a nova estrutura do backend Supreme
type DraftMemory = Pick<
  Memory,
  "title" | "content" | "category" | "tags" | "importance" | "project_id"
>;
const EMPTY_DRAFT: DraftMemory = {
  title: "",
  content: "",
  category: "general",
  tags: "",
  importance: 5,
  project_id: null,
};

export default function MemoryView() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftMemory>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    memoryAPI.getAll().then((r) => {
      store.setMemories(r.data);
      setLoading(false);
    });
  }, []);

  const filtered =
    cat === "all"
      ? store.memories
      : store.memories.filter((m) => m.category === cat);

  const openCreate = () => {
    setEditId(null);
    setDraft(EMPTY_DRAFT);
    setShowForm(true);
  };

  const openEdit = (m: Memory) => {
    setEditId(m.id);
    setDraft({
      title: m.title,
      content: m.content,
      category: m.category,
      tags: m.tags,
      importance: m.importance,
      project_id: m.project_id,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const r = await memoryAPI.update(editId, draft);
        store.upsertMemory(r.data);
      } else {
        const r = await memoryAPI.create(draft);
        store.upsertMemory(r.data);
      }
      setShowForm(false);
      setDraft(EMPTY_DRAFT);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Deletar esta memória do sistema?")) return;
    await memoryAPI.delete(id);
    store.removeMemory(id);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-j-emerald" /> Sistema de Memória
          </h1>
          <p className="text-xs text-j-muted mt-0.5">
            {store.memories.length}{" "}
            {store.memories.length === 1
              ? "memória consolidada"
              : "memórias consolidadas"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-j-emerald/10
                     hover:bg-j-emerald/20 text-j-emerald text-sm font-medium
                     transition-all border border-j-emerald/20"
        >
          <Plus className="w-4 h-4" /> Armazenar Memória
        </button>
      </div>

      {/* ── Filtro de Categorias ── */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${
              cat === c
                ? "bg-j-emerald/10 text-j-emerald border-j-emerald/30"
                : "text-j-muted border-j-border hover:border-j-dim hover:text-j-text"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Formulário de Criação / Edição ── */}
      {showForm && (
        <div className="bg-j-card border border-j-border rounded-xl p-5 mb-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {editId ? "Editar Memória" : "Consolidar Nova Memória"}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-j-muted hover:text-j-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-j-muted mb-1 block">
                Título / Rótulo
              </label>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Ex: Stack tecnológica preferida"
                className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm
                           text-j-text placeholder-j-dim outline-none focus:border-j-emerald/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-j-muted mb-1 block">
                Categoria
              </label>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
                className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm
                           text-j-text outline-none focus:border-j-emerald/30 transition-colors"
              >
                {CATS.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c} className="bg-j-card">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-j-muted mb-1 block">
              Conteúdo da Memória
            </label>
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder="Ex: Python no backend (FastAPI) e React no frontend."
              rows={3}
              className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm
                         text-j-text placeholder-j-dim outline-none resize-none
                         focus:border-j-emerald/30 transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-j-muted mb-1 block">Tags</label>
            <input
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              placeholder="programação, regras, stack"
              className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm
                           text-j-text placeholder-j-dim outline-none focus:border-j-emerald/30 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-j-muted">
                Nível de Importância:
              </span>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setDraft({ ...draft, importance: i + 1 })}
                    className={`w-3.5 h-3.5 rounded-sm transition-all ${
                      i < draft.importance
                        ? "bg-j-emerald"
                        : "bg-j-border hover:bg-j-dim"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-j-emerald font-medium">
                {draft.importance}/10
              </span>
            </div>

            <button
              onClick={save}
              disabled={saving || !draft.title.trim() || !draft.content.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-j-emerald/10
                         text-j-emerald text-sm border border-j-emerald/20
                         hover:bg-j-emerald/20 transition-all disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Consolidando..." : "Consolidar Memória"}
            </button>
          </div>
        </div>
      )}

      {/* ── Grade de Memórias ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-j-card rounded-xl animate-pulse border border-j-border"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-j-dim">
          <Brain className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm text-j-muted">
            Nenhuma memória encontrada nesta categoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="group bg-j-card border border-j-border rounded-xl p-4
                         hover:border-j-dim transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {m.title}
                  </p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border
                                   capitalize mt-1 inline-block ${CAT_STYLE[m.category] ?? CAT_STYLE.general}`}
                  >
                    {m.category}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-1 text-j-muted hover:text-j-text transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => del(m.id)}
                    className="p-1 text-j-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-j-muted leading-relaxed mb-3 line-clamp-2 flex-1">
                {m.content}
              </p>

              <div className="flex items-center justify-between border-t border-j-border/50 pt-2 mt-auto">
                <div className="flex gap-0.5 items-center">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-1.5 rounded-sm ${i < m.importance ? "bg-j-emerald" : "bg-j-border"}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-j-dim">
                  {formatDistanceToNow(new Date(m.updated_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
