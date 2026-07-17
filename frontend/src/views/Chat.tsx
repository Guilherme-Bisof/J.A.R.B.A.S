import { useEffect, useRef, useState } from "react";
import { chatAPI } from "../api/client";
import { useStore } from "../store/useStore";
import type { Message } from "../types";
import {
  Plus,
  Send,
  Trash2,
  MessageSquare,
  Bot,
  User,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Chat() {
  const store = useStore();
  const [input, setInput] = useState("");
  const [ttsOn, setTtsOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<any>(null);

  // Load conversations on mount
  useEffect(() => {
    chatAPI.getConversations().then((r) => {
      store.setConversations(r.data);
      setLoadingConvs(false);
    });
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!store.activeConvId) return;
    setLoadingMsgs(true);
    chatAPI.getMessages(store.activeConvId).then((r) => {
      store.setMessages(r.data);
      setLoadingMsgs(false);
    });
  }, [store.activeConvId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [store.messages, store.isTyping]);

  const newConversation = async () => {
    const r = await chatAPI.createConversation();
    store.addConversation(r.data);
    store.setActiveConv(r.data.id);
    store.setMessages([]);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatAPI.deleteConversation(id);
    store.removeConversation(id);
    if (store.activeConvId === id) store.setActiveConv(null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !store.activeConvId || store.isTyping) return;
    setInput("");
    store.setIsTyping(true);
    try {
      const r = await chatAPI.send(store.activeConvId, text);
      store.pushMessage(r.data.user_message);
      store.pushMessage(r.data.assistant_message);
      // Update conversation title in sidebar
      store.updateConversation({
        ...store.conversations.find((c) => c.id === store.activeConvId)!,
        title:
          r.data.user_message.content.slice(0, 45) +
          (r.data.user_message.content.length > 45 ? "…" : ""),
        updated_at: new Date().toISOString(),
      });
      // TTS
      if (ttsOn && "speechSynthesis" in window) {
        const utt = new SpeechSynthesisUtterance(
          r.data.assistant_message.content,
        );
        utt.rate = 1.05;
        window.speechSynthesis.speak(utt);
      }
    } catch {
      store.pushMessage({
        id: Date.now().toString(),
        conversation_id: store.activeConvId,
        role: "assistant",
        content:
          "⚠ Failed to reach J.A.R.B.A.S. backend. Is the server running?",
        created_at: new Date().toISOString(),
      });
    } finally {
      store.setIsTyping(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const toggleVoice = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported. Use Chrome or Edge.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.onresult = (e: any) => setInput((p) => p + e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  return (
    <div className="flex h-full">
      {/* ── Conversations sidebar ── */}
      <div className="w-56 flex-shrink-0 bg-j-surface border-r border-j-border flex flex-col">
        <div className="p-3 border-b border-j-border">
          <button
            onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                       bg-j-cyan/10 hover:bg-j-cyan/20 text-j-cyan text-sm font-medium
                       transition-all border border-j-cyan/20"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingConvs ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 bg-j-hover rounded-lg animate-pulse"
              />
            ))
          ) : store.conversations.length === 0 ? (
            <p className="text-center text-xs text-j-muted py-8">
              No conversations
            </p>
          ) : (
            store.conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => store.setActiveConv(c.id)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                              transition-all ${
                                store.activeConvId === c.id
                                  ? "bg-j-cyan/10 border border-j-cyan/20 text-j-cyan"
                                  : "border border-transparent text-j-muted hover:bg-j-hover hover:text-j-text"
                              }`}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs flex-1 truncate">{c.title}</span>
                <button
                  onClick={(e) => deleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!store.activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-j-cyan to-blue-600
                            flex items-center justify-center shadow-xl shadow-j-cyan/20"
            >
              <Bot className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                J.A.R.B.A.S. Ready
              </h2>
              <p className="text-j-muted text-sm max-w-xs">
                Create a conversation to begin. I'm ready for any task —
                analysis, planning, code, strategy.
              </p>
            </div>
            <button
              onClick={newConversation}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-j-cyan/10
                         hover:bg-j-cyan/20 text-j-cyan font-medium transition-all border border-j-cyan/20"
            >
              <Plus className="w-4 h-4" /> Start Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {loadingMsgs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-j-cyan/40" />
                </div>
              ) : store.messages.length === 0 ? (
                <p className="text-center text-j-muted text-sm py-12">
                  Conversation started. Send your first message.
                </p>
              ) : (
                store.messages.map((m) => <Bubble key={m.id} msg={m} />)
              )}

              {store.isTyping && (
                <div className="flex gap-3 items-start">
                  <Avatar assistant />
                  <div className="bg-j-card border border-j-border rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-j-cyan/60 rounded-full blink-1" />
                      <div className="w-1.5 h-1.5 bg-j-cyan/60 rounded-full blink-2" />
                      <div className="w-1.5 h-1.5 bg-j-cyan/60 rounded-full blink-3" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-j-border">
              <div className="flex gap-2 items-end bg-j-card border border-j-border rounded-xl p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Message J.A.R.B.A.S.  —  Shift+Enter for new line"
                  rows={1}
                  style={{ minHeight: 36, maxHeight: 160 }}
                  className="flex-1 bg-transparent text-sm text-j-text placeholder-j-dim
                             resize-none outline-none px-2 py-1 leading-relaxed"
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 160) + "px";
                  }}
                />
                <div className="flex gap-1.5 flex-shrink-0">
                  {/* TTS toggle */}
                  <button
                    onClick={() => setTtsOn(!ttsOn)}
                    title={
                      ttsOn ? "Disable voice output" : "Enable voice output"
                    }
                    className={`p-2 rounded-lg transition-all ${
                      ttsOn
                        ? "bg-j-cyan/10 text-j-cyan border border-j-cyan/30"
                        : "text-j-muted hover:text-j-text hover:bg-j-hover"
                    }`}
                  >
                    {ttsOn ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>

                  {/* Voice input */}
                  <button
                    onClick={toggleVoice}
                    title={listening ? "Stop listening" : "Voice input"}
                    className={`p-2 rounded-lg transition-all ${
                      listening
                        ? "bg-red-400/10 text-red-400 border border-red-400/30 animate-pulse"
                        : "text-j-muted hover:text-j-text hover:bg-j-hover"
                    }`}
                  >
                    {listening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  {/* Send */}
                  <button
                    onClick={send}
                    disabled={!input.trim() || store.isTyping}
                    className="p-2 rounded-lg bg-j-cyan/10 hover:bg-j-cyan/20 text-j-cyan
                               transition-all border border-j-cyan/20
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {store.isTyping ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-center text-j-dim mt-2">
                Enter to send · Shift+Enter for newline · Mic for voice input ·
                Speaker for voice output
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Avatar({ assistant = false }: { assistant?: boolean }) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        assistant
          ? "bg-gradient-to-br from-j-cyan to-blue-600"
          : "bg-j-hover border border-j-border"
      }`}
    >
      {assistant ? (
        <Bot className="w-3.5 h-3.5 text-white" />
      ) : (
        <User className="w-3.5 h-3.5 text-j-muted" />
      )}
    </div>
  );
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : ""}`}
    >
      <Avatar assistant={!isUser} />
      <div
        className={`max-w-[80%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-j-cyan/10 border border-j-cyan/20 text-j-text rounded-tr-sm"
              : "bg-j-card border border-j-border text-j-text rounded-tl-sm"
          }`}
        >
          {msg.content}
        </div>
        <span className="text-[10px] text-j-dim px-1">
          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
