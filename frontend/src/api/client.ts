import axios from "axios";
import type {
  Conversation,
  Message,
  Note,
  Memory,
  SearchResults,
  Project,
  Knowledge
} from "../types";

export const vaultAPI = {
  getAll: (params?: any) => http.get<any[]>("/vault/", { params }),
  getOne: (id: string) => http.get<any>(`/vault/${id}`),
  create: (data: any) => http.post<any>("/vault/", data),
  update: (id: string, data: any) => http.patch<any>(`/vault/${id}`, data),
  delete: (id: string) => http.delete(`/vault/${id}`),
};

export const linksAPI = {
  getLinks: (itemId: string) => http.get<any[]>(`/vault/${itemId}/links`),
  create: (data: { from_id: string; to_id: string; link_type?: string }) =>
    http.post<any>("/vault/links", data),
  delete: (linkId: string) => http.delete(`/vault/links/${linkId}`),
};

export const documentsAPI = {
  upload: (file: File, category?: string, tags?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category || "general");
    formData.append("tags", tags || "");
    return http.post<any>("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: () => http.get<any[]>("/documents/list"),
  delete: (id: string) => http.delete(`/documents/${id}`),
};

export const intelligenceAPI = {
  process: (itemId: string) => http.post<any>(`/intelligence/process/${itemId}`),
  analyze: (itemId: string, question: string) => http.post<{answer: string}>(`/intelligence/analyze/${itemId}`, { question }),
  runGlobalRelationships: () => http.post<{message: string, new_connections: number}>(`/intelligence/relationships/global`),
};

const http = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const chatAPI = {
  getConversations: () => http.get<Conversation[]>("/chat/conversations"),

  createConversation: (title = "New Conversation") =>
    http.post<Conversation>("/chat/conversations", { title }),

  deleteConversation: (id: string) => http.delete(`/chat/conversations/${id}`),

  getMessages: (convId: string) =>
    http.get<Message[]>(`/chat/conversations/${convId}/messages`),

  send: (conversation_id: string, content: string) =>
    http.post<{ user_message: Message; assistant_message: Message }>(
      "/chat/send",
      { conversation_id, content },
    ),
};

export const notesAPI = {
  getAll: (params?: { category?: string; tag?: string }) =>
    vaultAPI.getAll({ ...params, item_type: "note" }),

  create: (data: {
    title: string;
    content?: string;
    tags?: string;
    category?: string;
  }) => vaultAPI.create({ ...data, item_type: "note" }),

  update: (
    id: string,
    data: Partial<Pick<Note, "title" | "content" | "tags" | "category">>,
  ) => vaultAPI.update(id, data),

  delete: (id: string) => vaultAPI.delete(id),
};

export const memoryAPI = {
  getAll: (category?: string) =>
    vaultAPI.getAll({ item_type: "memory", category: category && category !== "all" ? category : undefined }),

  create: (data: {
    title: string;
    content: string;
    category?: string;
    tags?: string;
    importance?: number;
    project_id?: string | null;
  }) => vaultAPI.create({ ...data, item_type: "memory" }),

  update: (
    id: string,
    data: Partial<
      Pick<
        Memory,
        "title" | "content" | "category" | "tags" | "importance" | "project_id"
      >
    >,
  ) => vaultAPI.update(id, data),

  delete: (id: string) => vaultAPI.delete(id),
};

export const searchAPI = {
  search: (q: string) => http.get<SearchResults>("/search/", { params: { q } }),
};

export const projectsAPI = {
  getAll: () => http.get<Project[]>("/projects/"),

  create: (data: { name: string; description?: string; status?: string }) =>
    http.post<Project>("/projects/", data),

  update: (
    id: string,
    data: Partial<Pick<Project, "name" | "description" | "status">>,
  ) => http.patch<Project>(`/projects/${id}`, data),

  delete: (id: string) => http.delete(`/projects/${id}`),
};

export const knowledgeAPI = {
  getAll: () => vaultAPI.getAll({ item_type: "document" }),

  create: (data: {
    title: string;
    content?: string;
    category?: string;
    source?: string;
    tags?: string;
    project_id?: string | null;
  }) => vaultAPI.create({ ...data, item_type: "document" }),

  update: (
    id: string,
    data: Partial<Omit<Knowledge, "id" | "created_at" | "updated_at">>,
  ) => vaultAPI.update(id, data),

  delete: (id: string) => vaultAPI.delete(id),
};