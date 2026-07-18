import { useEffect, useState } from "react";
import { Plus, Save, Trash2, FileText, Tag, Search, Edit2 } from "lucide-react";
import { notesAPI } from "../api/client";
import { useStore } from "../store/useStore";
import type { Note } from "../types";
import { formatDistanceToNow } from "date-fns";

export default function Notes() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<
    Pick<Note, "title" | "content" | "tags" | "category">
  >({
    title: "",
    content: "",
    tags: "",
    category: "general",
  });

  useEffect(() => {
    notesAPI.getAll().then((r) => {
      store.setNotes(r.data);
      setLoading(false);
    });
  }, []);

  const activeNote =
    store.notes.find((n) => n.id === store.activeNoteId) ?? null;

  const select = (note: Note) => {
    store.setActiveNote(note.id);
    setDraft({
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.category,
    });
    setEditing(false);
  };

  const createNote = async () => {
    const r = await notesAPI.create({
      title: "Untitled Note",
      content: "",
      tags: "",
      category: "general",
    });
    store.upsertNote(r.data);
    select(r.data);
    setEditing(true);
  };

  const save = async () => {
    if (!store.activeNoteId || !draft.title.trim()) return;
    setSaving(true);
    const r = await notesAPI.update(store.activeNoteId, draft);
    store.upsertNote(r.data);
    setEditing(false);
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this note permanently?")) return;
    await notesAPI.delete(id);
    store.removeNote(id);
    if (store.activeNoteId === id) store.setActiveNote(null);
  };

  const filtered = store.notes.filter(
    (n) =>
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.tags || "").toLowerCase().includes(search.toLowerCase()) ||
      (n.content || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full">
      {/*  Note list sidebar  */}
      <div className="w-64 flex-shrink-0 bg-j-surface border-r border-j-border flex flex-col">
        <div className="p-3 space-y-2 border-b border-j-border">
          <button
            onClick={createNote}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                       bg-j-violet/10 hover:bg-j-violet/20 text-j-violet text-sm font-medium
                       transition-all border border-j-violet/20"
          >
            <Plus className="w-4 h-4" /> New Note
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-j-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-j-card border border-j-border rounded-lg py-1.5 pl-8 pr-3
                         text-xs text-j-text placeholder-j-dim outline-none
                         focus:border-j-violet/40 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-j-hover rounded-lg animate-pulse"
              />
            ))
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-j-muted py-8">
              {search ? "No matches" : "No notes yet"}
            </p>
          ) : (
            filtered.map((note) => (
              <div
                key={note.id}
                onClick={() => select(note)}
                className={`group relative px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  store.activeNoteId === note.id
                    ? "bg-j-violet/10 border border-j-violet/20"
                    : "border border-transparent hover:bg-j-hover"
                }`}
              >
                <p
                  className={`text-xs font-medium truncate ${
                    store.activeNoteId === note.id
                      ? "text-j-violet"
                      : "text-j-text"
                  }`}
                >
                  {note.title}
                </p>
                {note.tags && (
                  <p className="text-[10px] text-j-violet/50 mt-0.5 truncate">
                    #{note.tags.split(",")[0].trim()}
                  </p>
                )}
                <p className="text-[10px] text-j-dim mt-0.5">
                  {formatDistanceToNow(new Date(note.updated_at), {
                    addSuffix: true,
                  })}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    del(note.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                             text-j-muted hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/*  Editor panel  */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeNote ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div
              className="w-14 h-14 rounded-xl bg-j-violet/10 border border-j-violet/20
                            flex items-center justify-center"
            >
              <FileText className="w-7 h-7 text-j-violet/40" />
            </div>
            <p className="text-j-muted text-sm">Select a note or create one</p>
            <button
              onClick={createNote}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-j-violet/10
                         text-j-violet text-sm border border-j-violet/20
                         hover:bg-j-violet/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Create First Note
            </button>
          </div>
        ) : (
          <>
            {/* Title bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-j-border">
              {editing ? (
                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  className="flex-1 text-lg font-bold text-white bg-transparent border-b
                             border-j-violet/40 outline-none pb-0.5"
                  placeholder="Note title..."
                  autoFocus
                />
              ) : (
                <h2 className="flex-1 text-lg font-bold text-white truncate">
                  {activeNote.title}
                </h2>
              )}
              <div className="flex items-center gap-2 flex-shrink-0">
                {editing ? (
                  <>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setDraft({
                          title: activeNote.title,
                          content: activeNote.content,
                          tags: activeNote.tags,
                          category: activeNote.category,
                        });
                      }}
                      className="text-xs text-j-muted hover:text-j-text px-3 py-1.5
                                 rounded-lg hover:bg-j-hover transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs text-j-emerald px-3 py-1.5
                                 rounded-lg bg-j-emerald/10 border border-j-emerald/20
                                 hover:bg-j-emerald/20 transition-all disabled:opacity-40"
                    >
                      <Save className="w-3 h-3" />
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs text-j-muted hover:text-j-text
                               px-3 py-1.5 rounded-lg hover:bg-j-hover transition-all"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
            </div>

            {/* Tags / metadata row */}
            <div className="flex items-center gap-2 px-6 py-2.5 border-b border-j-border">
              <Tag className="w-3 h-3 text-j-dim flex-shrink-0" />
              {editing ? (
                <input
                  value={draft.tags}
                  onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="text-xs text-j-violet bg-transparent outline-none flex-1
                             placeholder-j-dim"
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {activeNote.tags ? (
                    activeNote.tags
                      .split(",")
                      .filter(Boolean)
                      .map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-j-violet/10
                                       text-j-violet/80 border border-j-violet/20"
                        >
                          #{t.trim()}
                        </span>
                      ))
                  ) : (
                    <span className="text-[10px] text-j-dim">No tags</span>
                  )}
                </div>
              )}
              <span className="ml-auto text-[10px] text-j-dim flex-shrink-0">
                {formatDistanceToNow(new Date(activeNote.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6">
              {editing ? (
                <textarea
                  value={draft.content}
                  onChange={(e) =>
                    setDraft({ ...draft, content: e.target.value })
                  }
                  placeholder={
                    "# Heading\n\nWrite in Markdown...\n\n**bold**, _italic_, - list items"
                  }
                  className="w-full h-full min-h-96 bg-transparent text-sm text-j-text
                             placeholder-j-dim outline-none resize-none leading-relaxed font-mono"
                />
              ) : activeNote.content ? (
                <pre className="whitespace-pre-wrap text-sm text-j-text leading-relaxed font-sans">
                  {activeNote.content}
                </pre>
              ) : (
                <p className="text-j-dim italic text-sm">
                  Empty note — click Edit to add content.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
