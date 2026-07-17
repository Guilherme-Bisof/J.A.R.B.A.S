export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  title: string;
  content: string; 
  category: string;
  tags: string;
  importance: number;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResults {
  notes: Note[];
  memories: Memory[];
  total: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export interface Knowledge {
  id: string;
  title: string;
  category: string;
  content: string;
  source: string;
  tags: string;
  item_type: string;
  importance: number;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeLink {
  id: string;
  from_id: string;
  to_id: string;
  link_type: string;
  created_at: string;
  linked_title: string;
  linked_type: string;
}
