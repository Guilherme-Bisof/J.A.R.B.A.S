import { useEffect, useState } from "react";
import { vaultAPI, linksAPI, documentsAPI, intelligenceAPI } from "../api/client";
import { useStore } from "../store/useStore";
import type { Knowledge, KnowledgeLink } from "../types";
import {
  Library,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Tag,
  Link2,
  ChevronLeft,
  Clock,
  Folder,
  Star,
  Search,
  Upload,
  FileText,
  BrainCircuit,
  Loader2,
  Send,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type DraftKnowledge = Omit<Knowledge, "id" | "created_at" | "updated_at">;
const EMPTY_DRAFT: DraftKnowledge = {
  title: "",
  category: "general",
  content: "",
  source: "manual",
  tags: "",
  item_type: "note",
  importance: 5,
  project_id: null,
};

export default function KnowledgeView() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftKnowledge>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  //  Estado do Visualizador 
  const [selectedItem, setSelectedItem] = useState<Knowledge | null>(null);
  const [itemLinks, setItemLinks] = useState<KnowledgeLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  //  Estado de Inteligência 
  const [processingAI, setProcessingAI] = useState(false);

  //  Estado de Upload 
  const [uploading, setUploading] = useState(false);

  //  Estado do Analyzer e Relationship Engine 
  const [analyzerInput, setAnalyzerInput] = useState("");
  const [analyzerAnswer, setAnalyzerAnswer] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [mappingGlobal, setMappingGlobal] = useState(false);

  useEffect(() => {
    vaultAPI.getAll().then((res) => {
      store.setKnowledge(res.data);
      setLoading(false);
    });
  }, []);

  //  Funções de CRUD 
  const openCreate = () => {
    setEditId(null);
    setDraft(EMPTY_DRAFT);
    setShowForm(true);
    setSelectedItem(null);
  };
  const openEdit = (k: Knowledge) => {
    setEditId(k.id);
    setDraft({
      title: k.title,
      category: k.category,
      content: k.content,
      source: k.source,
      tags: k.tags,
      item_type: k.item_type || "note",
      importance: k.importance || 5,
      project_id: k.project_id,
    });
    setShowForm(true);
    setSelectedItem(null);
  };

  const save = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const r = await vaultAPI.update(editId, draft);
        store.upsertKnowledge(r.data);
      } else {
        const r = await vaultAPI.create(draft);
        store.upsertKnowledge(r.data);
      }
      setShowForm(false);
      setDraft(EMPTY_DRAFT);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Deletar este registro de conhecimento?")) return;
    await vaultAPI.delete(id);
    store.removeKnowledge(id);
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  //  Upload de Documento 
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const res = await documentsAPI.upload(e.target.files[0]);
      store.upsertKnowledge(res.data);
    } catch (err) {
      alert("Erro ao enviar documento.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  //  Processamento Local de Inteligência 
  const handleProcessAI = async () => {
    if (!selectedItem) return;
    setProcessingAI(true);
    try {
      const res = await intelligenceAPI.process(selectedItem.id);
      
      // Atualiza o item local com a nova categoria e tags
      setSelectedItem(res.data.item);
      store.upsertKnowledge(res.data.item);
      
      // Recarrega o cofre inteiro para puxar os novos Fatos criados pelo J.A.R.B.A.S.
      const vaultRes = await vaultAPI.getAll();
      store.setKnowledge(vaultRes.data);
      
      // Recarrega os links para mostrar os novos fatos criados no painel
      const linksRes = await linksAPI.getLinks(selectedItem.id);
      setItemLinks(linksRes.data);
      
      alert(`Processamento Local Finalizado!\nForam extraídos ${res.data.facts_created} fatos novos e as tags foram atualizadas.`);
    } catch (err: any) {
      alert(`Falha no Ollama: ${err.response?.data?.detail || "Erro de conexão com o localhost:11434"}`);
    } finally {
      setProcessingAI(false);
    }
  };

  //  Knowledge Analyzer 
  const handleAnalyze = async () => {
    if (!selectedItem || !analyzerInput.trim()) return;
    setAnalyzing(true);
    setAnalyzerAnswer("");
    try {
      const res = await intelligenceAPI.analyze(selectedItem.id, analyzerInput);
      setAnalyzerAnswer(res.data.answer);
    } catch (err: any) {
      setAnalyzerAnswer("Erro ao analisar documento: " + (err.response?.data?.detail || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  //  Funções do Visualizador 
  const openViewer = async (k: Knowledge) => {
    setSelectedItem(k);
    setShowForm(false);
    setLoadingLinks(true);
    try {
      const res = await linksAPI.getLinks(k.id);
      setItemLinks(res.data);
    } catch {
      setItemLinks([]);
    } finally {
      setLoadingLinks(false);
    }
  };

  //  Filtragem 
  const filtered = store.knowledge.filter((k) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      k.title.toLowerCase().includes(s) ||
      k.content.toLowerCase().includes(s) ||
      (k.tags || "").toLowerCase().includes(s) ||
      (k.category || "").toLowerCase().includes(s)
    );
  });

  //  Renderização de Tags como badges 
  const renderTags = (tagsStr: string) => {
    if (!tagsStr) return null;
    const tagList = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1.5">
        {tagList.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20"
          >
            <Tag className="w-2.5 h-2.5" />
            {tag}
          </span>
        ))}
      </div>
    );
  };

  //  Tipo badge 
  const typeBadge = (type: string) => {
    const map: Record<string, { color: string; label: string }> = {
      note: { color: "text-blue-400 bg-blue-500/15 border-blue-500/20", label: "Nota" },
      memory: { color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20", label: "Memória" },
      document: { color: "text-amber-400 bg-amber-500/15 border-amber-500/20", label: "Documento" },
      fact: { color: "text-rose-400 bg-rose-500/15 border-rose-500/20", label: "Fato" },
    };
    const m = map[type] || map.note;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${m.color}`}>
        {m.label}
      </span>
    );
  };

  //  Visualizador de Conteúdo  
  if (selectedItem) {
    return (
      <div className="h-full flex flex-col p-6 overflow-y-auto animate-fade-in">
        {/* Botão Voltar */}
        <button
          onClick={() => setSelectedItem(null)}
          className="flex items-center gap-1.5 text-j-muted hover:text-j-text text-sm mb-4 transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar ao Cofre
        </button>

        {/* Cabeçalho do Item */}
        <div className="bg-j-card border border-j-border rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {typeBadge(selectedItem.item_type || "note")}
                <span className="text-[10px] text-j-muted px-2 py-0.5 rounded-full bg-j-hover border border-j-border">
                  <Folder className="w-2.5 h-2.5 inline mr-1" />
                  {selectedItem.category || "general"}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mb-1">{selectedItem.title}</h1>
              <div className="flex items-center gap-3 text-[11px] text-j-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(selectedItem.created_at), { addSuffix: true, locale: ptBR })}
                </span>
                {selectedItem.importance > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    Importância: {selectedItem.importance}/10
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleProcessAI}
                disabled={processingAI}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition-all disabled:opacity-50"
              >
                {processingAI ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Pensando...</>
                ) : (
                  <><BrainCircuit className="w-3.5 h-3.5" /> J.A.R.B.A.S. Intel</>
                )}
              </button>
              <button
                onClick={() => openEdit(selectedItem)}
                className="p-2 rounded-lg bg-j-hover hover:bg-j-amber/10 text-j-muted hover:text-j-amber transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => del(selectedItem.id)}
                className="p-2 rounded-lg bg-j-hover hover:bg-red-500/10 text-j-muted hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tags */}
          {selectedItem.tags && (
            <div className="mt-3 pt-3 border-t border-j-border">
              {renderTags(selectedItem.tags)}
            </div>
          )}
        </div>

        {/* Conteúdo  */}
        <div className="bg-j-card border border-j-border rounded-xl p-6 mb-4 flex-1">
          <h2 className="text-xs font-semibold text-j-muted uppercase tracking-wider mb-3">Conteúdo</h2>
          <div className="text-sm text-j-text leading-relaxed whitespace-pre-wrap">
            {selectedItem.content || <span className="text-j-muted italic">Sem conteúdo.</span>}
          </div>
        </div>

        {/* Painel de Links */}
        <div className="bg-j-card border border-j-border rounded-xl p-5">
          <h2 className="text-xs font-semibold text-j-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Links Conectados
          </h2>
          {loadingLinks ? (
            <p className="text-xs text-j-muted">Carregando links...</p>
          ) : itemLinks.length === 0 ? (
            <p className="text-xs text-j-muted italic">Nenhum link conectado a este item.</p>
          ) : (
            <div className="grid gap-2">
              {itemLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    const target = store.knowledge.find(
                      (k) => k.id === (link.from_id === selectedItem.id ? link.to_id : link.from_id)
                    );
                    if (target) openViewer(target);
                  }}
                  className="flex items-center justify-between bg-j-hover rounded-lg px-3 py-2 text-left hover:bg-j-amber/5 hover:border-j-amber/20 border border-transparent transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3 h-3 text-j-amber" />
                    <span className="text-sm text-j-text group-hover:text-white transition-colors">
                      {link.linked_title}
                    </span>
                  </div>
                  <span className="text-[10px] text-j-muted px-1.5 py-0.5 rounded bg-j-card">
                    {link.link_type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/*  Knowledge Analyzer (Ollama)  */}
        <div className="bg-j-card border border-j-border rounded-xl p-5 mb-8">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" /> Knowledge Analyzer
          </h2>
          
          <div className="flex gap-2 items-end bg-j-surface border border-j-border rounded-xl p-2 mb-4 focus-within:border-indigo-500/50 transition-colors">
            <textarea
              value={analyzerInput}
              onChange={(e) => setAnalyzerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              placeholder="Pergunte algo específico sobre este documento..."
              rows={1}
              style={{ minHeight: 40, maxHeight: 120 }}
              className="flex-1 bg-transparent text-sm text-j-text placeholder-j-dim resize-none outline-none px-3 py-2 leading-relaxed"
            />
            <button
              onClick={handleAnalyze}
              disabled={!analyzerInput.trim() || analyzing}
              className="p-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all border border-indigo-500/20 disabled:opacity-30 flex-shrink-0"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {/* Resposta do Analyzer */}
          {analyzing && (
            <div className="flex items-center gap-2 text-indigo-400 text-sm p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <Loader2 className="w-4 h-4 animate-spin" /> 
              Analisando documento...
            </div>
          )}
          
          {!analyzing && analyzerAnswer && (
            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-sm text-j-text leading-relaxed whitespace-pre-wrap">
              {analyzerAnswer}
            </div>
          )}
        </div>

      </div>
    );
  }

  //  LISTA / GRID  
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Library className="w-5 h-5 text-j-amber" /> Knowledge Vault
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  setMappingGlobal(true);
                  const res = await intelligenceAPI.runGlobalRelationships();
                  alert(`Mapeamento concluído! Novas conexões neurais descobertas: ${res.data.new_connections}`);
                  vaultAPI.getAll().then((r) => store.setKnowledge(r.data)); // refresh
                } catch (e) {
                  alert("Erro ao mapear conexões.");
                } finally {
                  setMappingGlobal(false);
                }
              }}
              disabled={mappingGlobal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-sm font-medium border border-pink-500/20 transition-all disabled:opacity-50"
            >
              {mappingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
              {mappingGlobal ? "Mapeando..." : "Mapear Cérebro"}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-j-amber/10 hover:bg-j-amber/20 text-j-amber text-sm font-medium border border-j-amber/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Registro
            </button>
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-sm font-medium border border-violet-500/20 transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              {uploading ? "Enviando..." : "Upload PDF/TXT"}
              <input type="file" className="hidden" accept=".pdf,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css" onChange={handleUpload} />
            </label>
          </div>
        </div>

        {/* Barra de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-j-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no cofre..."
            className="w-full bg-j-card border border-j-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-j-text outline-none focus:border-j-amber/30 transition-colors"
          />
        </div>
      </div>

      {/* Formulário Criar/Editar */}
      {showForm && (
        <div className="bg-j-card border border-j-border rounded-xl p-5 mb-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {editId ? "Editar Conhecimento" : "Adicionar Conhecimento"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-j-muted hover:text-j-text">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Título"
            className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm text-j-text mb-2 outline-none focus:border-j-amber/30 transition-colors"
          />
          <textarea
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="Conteúdo (suporta Markdown)"
            rows={6}
            className="w-full bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm text-j-text mb-2 outline-none focus:border-j-amber/30 transition-colors font-mono"
          />
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              placeholder="Tags (ex: python, react)"
              className="bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm text-j-text outline-none focus:border-j-amber/30 transition-colors"
            />
            <input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Categoria"
              className="bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm text-j-text outline-none focus:border-j-amber/30 transition-colors"
            />
            <select
              value={draft.item_type}
              onChange={(e) => setDraft({ ...draft, item_type: e.target.value })}
              className="bg-j-hover border border-j-border rounded-lg px-3 py-2 text-sm text-j-text outline-none focus:border-j-amber/30 transition-colors"
            >
              <option value="note">Nota</option>
              <option value="memory">Memória</option>
              <option value="document">Documento</option>
              <option value="fact">Fato</option>
            </select>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-j-amber/10 hover:bg-j-amber/20 text-j-amber px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      )}

      {/* Grid de Cards */}
      {loading ? (
        <p className="text-j-muted text-sm">Carregando cofre...</p>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-j-muted text-sm">
            {search ? "Nenhum item encontrado para esta busca." : "O cofre está vazio. Crie seu primeiro registro!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((k) => (
            <div
              key={k.id}
              onClick={() => openViewer(k)}
              className="group bg-j-card border border-j-border rounded-xl p-5 hover:border-j-amber/30 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {typeBadge(k.item_type || "note")}
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate group-hover:text-j-amber transition-colors">
                    {k.title}
                  </h3>
                </div>
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(k); }}
                    className="p-1 rounded hover:bg-j-hover"
                  >
                    <Edit2 className="w-3 h-3 text-j-muted hover:text-j-text" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); del(k.id); }}
                    className="p-1 rounded hover:bg-j-hover"
                  >
                    <Trash2 className="w-3 h-3 text-j-muted hover:text-red-400" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-j-muted line-clamp-3 mb-2">{k.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {k.tags && (
                    <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">
                      #{k.tags.split(",")[0].trim()}
                    </span>
                  )}
                  {k.category && k.category !== "general" && (
                    <span className="text-[10px] text-j-muted bg-j-hover px-1.5 py-0.5 rounded-full">
                      {k.category}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-j-dim">
                  {formatDistanceToNow(new Date(k.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
