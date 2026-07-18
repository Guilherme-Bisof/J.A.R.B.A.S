import { create } from "zustand";
import type {
  Conversation,
  Message,
  Note,
  Memory,
  Project,
  Knowledge,
} from "../types";

interface AppState {
  //  Dados existentes 
  conversations: Conversation[];
  activeConvId: string | null;
  messages: Message[];
  isTyping: boolean;
  notes: Note[];
  activeNoteId: string | null;
  memories: Memory[];
  projects: Project[];
  knowledge: Knowledge[];

  // Ações existentes 
  setConversations: (v: Conversation[]) => void;
  addConversation: (v: Conversation) => void;
  removeConversation: (id: string) => void;
  updateConversation: (v: Conversation) => void;
  setActiveConv: (id: string | null) => void;
  setMessages: (v: Message[]) => void;
  pushMessage: (v: Message) => void;
  setIsTyping: (v: boolean) => void;
  setNotes: (v: Note[]) => void;
  upsertNote: (v: Note) => void;
  removeNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setMemories: (v: Memory[]) => void;
  upsertMemory: (v: Memory) => void;
  removeMemory: (id: string) => void;
  setProjects: (v: Project[]) => void;
  upsertProject: (v: Project) => void;
  removeProject: (id: string) => void;
  setKnowledge: (v: Knowledge[]) => void;
  upsertKnowledge: (v: Knowledge) => void;
  removeKnowledge: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  conversations: [],
  activeConvId: null,
  messages: [],
  isTyping: false,
  notes: [],
  activeNoteId: null,
  memories: [],
  projects: [],
  knowledge: [],


  setConversations: (v) => set({ conversations: Array.isArray(v) ? v : [] }),
  addConversation: (c) =>
    set((s) => ({ conversations: [c, ...s.conversations] })),
  removeConversation: (id) =>
    set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) })),
  updateConversation: (c) =>
    set((s) => ({
      conversations: s.conversations.map((x) => (x.id === c.id ? c : x)),
    })),
  setActiveConv: (activeConvId) => set({ activeConvId, messages: [] }),

  setMessages: (v) => set({ messages: Array.isArray(v) ? v : [] }),
  pushMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setIsTyping: (isTyping) => set({ isTyping }),

  setNotes: (v) => set({ notes: Array.isArray(v) ? v : [] }),
  upsertNote: (note) =>
    set((s) => ({
      notes: s.notes.some((n) => n.id === note.id)
        ? s.notes.map((n) => (n.id === note.id ? note : n))
        : [note, ...s.notes],
    })),
  removeNote: (id) =>
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  setActiveNote: (activeNoteId) => set({ activeNoteId }),

  setMemories: (v) => set({ memories: Array.isArray(v) ? v : [] }),
  upsertMemory: (m) =>
    set((s) => ({
      memories: s.memories.some((x) => x.id === m.id)
        ? s.memories.map((x) => (x.id === m.id ? m : x))
        : [m, ...s.memories],
    })),
  removeMemory: (id) =>
    set((s) => ({ memories: s.memories.filter((m) => m.id !== id) })),

  setProjects: (v) => set({ projects: Array.isArray(v) ? v : [] }),
  upsertProject: (p) =>
    set((s) => ({
      projects: s.projects.some((x) => x.id === p.id)
        ? s.projects.map((x) => (x.id === p.id ? p : x))
        : [p, ...s.projects],
    })),
  removeProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  setKnowledge: (v) => set({ knowledge: Array.isArray(v) ? v : [] }),
  upsertKnowledge: (k) =>
    set((s) => ({
      knowledge: s.knowledge.some((x) => x.id === k.id)
        ? s.knowledge.map((x) => (x.id === k.id ? k : x))
        : [k, ...s.knowledge],
    })),
  removeKnowledge: (id) =>
    set((s) => ({ knowledge: s.knowledge.filter((k) => k.id !== id) })),
}));
