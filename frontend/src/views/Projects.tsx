import { useEffect, useState } from "react";
import { projectsAPI } from "../api/client";
import { useStore } from "../store/useStore";
import type { Project } from "../types";
import { FolderGit2, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type DraftProject = Pick<Project, "name" | "description" | "status">;
const EMPTY_DRAFT: DraftProject = {
  name: "",
  description: "",
  status: "active",
};

export default function Projects() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftProject>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  // Busca os projetos na API assim que a tela é carregada
  useEffect(() => {
    projectsAPI.getAll().then((r) => {
      store.setProjects(r.data);
      setLoading(false);
    });
  }, []);

  // Prepara o formulário para um novo projeto
  const openCreate = () => {
    setEditId(null);
    setDraft(EMPTY_DRAFT);
    setShowForm(true);
  };

  // Prepara o formulário para editar um projeto existente
  const openEdit = (p: Project) => {
    setEditId(p.id);
    setDraft({ name: p.name, description: p.description, status: p.status });
    setShowForm(true);
  };

  // Salva o projeto no backend
  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const r = await projectsAPI.update(editId, draft);
        store.upsertProject(r.data);
      } else {
        const r = await projectsAPI.create(draft);
        store.upsertProject(r.data);
      }
      setShowForm(false);
      setDraft(EMPTY_DRAFT);
    } finally {
      setSaving(false);
    }
  };

  // Deleta um projeto
  const del = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este projeto?")) return;
    await projectsAPI.delete(id);
    store.removeProject(id);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-j-cyan" /> Gerenciador de
            Projetos
          </h1>
          <p className="text-xs text-j-muted mt-0.5">
            {store.projects.length}{" "}
            {store.projects.length === 1 ? "projeto ativo" : "projetos ativos"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-j-cyan/10
                     hover:bg-j-cyan/20 text-j-cyan text-sm font-medium
                     transition-all border border-j-cyan/20"
        >
          <Plus className="w-4 h-4" /> Novo Projeto
        </button>
      </div>

      {/* ── Formulário de Criação/Edição ── */}
      {showForm && (
        <div className="bg-j-card border border-j-border rounded-xl p-5 mb-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {editId ? "Editar Projeto" : "Iniciar Novo Projeto"}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-j-muted hover:text-j-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-j-muted mb-1 block">
                Nome do Projeto
              </label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Ex: Shardwalker, SAIRLEX..."
                className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm
                           text-j-text placeholder-j-dim outline-none focus:border-j-cyan/30"
              />
            </div>
            <div>
              <label className="text-xs text-j-muted mb-1 block">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm
                           text-j-text outline-none focus:border-j-cyan/30"
              >
                <option value="active" className="bg-j-card">
                  Ativo
                </option>
                <option value="planned" className="bg-j-card">
                  Planejado
                </option>
                <option value="archived" className="bg-j-card">
                  Arquivado
                </option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-j-muted mb-1 block">
              Descrição e Objetivos
            </label>
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Descreva o propósito central deste projeto..."
              rows={3}
              className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm
                         text-j-text placeholder-j-dim outline-none resize-none focus:border-j-cyan/30"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving || !draft.name.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-j-cyan/10
                         text-j-cyan text-sm border border-j-cyan/20
                         hover:bg-j-cyan/20 transition-all disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Salvando..." : "Salvar Projeto"}
            </button>
          </div>
        </div>
      )}

      {/* ── Grid de Projetos ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-j-card rounded-xl animate-pulse border border-j-border"
            />
          ))}
        </div>
      ) : store.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-j-dim">
          <FolderGit2 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm text-j-muted">Nenhum projeto inicializado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {store.projects.map((p) => (
            <div
              key={p.id}
              className="group bg-j-card border border-j-border rounded-xl p-5 hover:border-j-cyan/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {p.name}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border mt-1.5 inline-block
                    ${
                      p.status === "active"
                        ? "text-j-emerald bg-j-emerald/10 border-j-emerald/20"
                        : p.status === "planned"
                          ? "text-j-cyan bg-j-cyan/10 border-j-cyan/20"
                          : "text-j-muted bg-j-hover border-j-border"
                    }`}
                  >
                    {p.status === "active"
                      ? "Ativo"
                      : p.status === "planned"
                        ? "Planejado"
                        : "Arquivado"}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 text-j-muted hover:text-j-text"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => del(p.id)}
                    className="p-1.5 text-j-muted hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-j-muted leading-relaxed line-clamp-2 mb-4">
                {p.description || "Sem descrição."}
              </p>
              <div className="text-[10px] text-j-dim">
                Atualizado{" "}
                {formatDistanceToNow(new Date(p.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
