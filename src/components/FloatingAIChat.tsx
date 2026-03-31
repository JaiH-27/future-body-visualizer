import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useHealthState } from '@/hooks/use-health-state';
import type { HabitLevel } from '@/lib/health-types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tglfrgxkinkoxbocadum.supabase.co';
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbGZyZ3hraW5rb3hib2NhZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDg4MjEsImV4cCI6MjA5MDE4NDgyMX0.l6qzeNnFKwKt6D1pj6qQvQ4jmPg6f2lZ9WFFGX6ZJck';

const STORAGE_KEY = 'ai-chat-tabs';

export type ChatMessage = { role: 'user' | 'ai'; text: string };

interface ChatTab {
  id: string;
  label: string;
  messages: ChatMessage[];
}

function loadTabs(): ChatTab[] {
  if (typeof window === 'undefined') return [{ id: '1', label: 'Chat 1', messages: [] }];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ChatTab[];
      if (parsed.length > 0) return parsed;
    }
  } catch {}
  return [{ id: '1', label: 'Chat 1', messages: [] }];
}

function saveTabs(tabs: ChatTab[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}

export default function FloatingAIChat() {
  const { habits, setHabits, demographics, setDemographics, biomarkers, setBiomarkers } = useHealthState();
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(true);
  const [tabs, setTabs] = useState<ChatTab[]>(() => loadTabs());
  const [activeTabId, setActiveTabId] = useState<string>(() => loadTabs()[0]?.id || '1');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBarRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const chatMessages = activeTab?.messages || [];

  // Persist tabs whenever they change
  useEffect(() => {
    saveTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Click outside to close chat bar
  useEffect(() => {
    if (!chatOpen) return;
    const handler = (e: MouseEvent) => {
      if (chatBarRef.current && !chatBarRef.current.contains(e.target as Node)) {
        setChatOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [chatOpen]);

  // Click outside to close log
  useEffect(() => {
    if (!logOpen) return;
    const handler = (e: MouseEvent) => {
      if (logRef.current && !logRef.current.contains(e.target as Node)) {
        setLogOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [logOpen]);

  const setChatMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      const newMsgs = typeof updater === 'function' ? updater(t.messages) : updater;
      return { ...t, messages: newMsgs };
    }));
  }, [activeTabId]);

  const addNewTab = useCallback(() => {
    const newId = Date.now().toString();
    const newTab: ChatTab = { id: newId, label: `Chat ${tabs.length + 1}`, messages: [] };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  }, [tabs.length]);

  const deleteTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.messages.length > 0) {
      if (!window.confirm(`Delete "${tab.label}" and its ${tab.messages.length} messages?`)) return;
    }
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (filtered.length === 0) {
        const fresh = { id: Date.now().toString(), label: 'Chat 1', messages: [] };
        setActiveTabId(fresh.id);
        return [fresh];
      }
      if (activeTabId === tabId) {
        setActiveTabId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeTabId, tabs]);

  const handleChat = useCallback(async (message: string) => {
    const updatedMessages = [...chatMessages, { role: 'user' as const, text: message }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/parse-habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          message,
          demographics,
          chatHistory: updatedMessages.slice(-10),
          currentHabits: habits,
          currentBiomarkers: biomarkers,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Something went wrong.');
        setChatLoading(false);
        return;
      }

      const data = await res.json();

      if (data.habits) {
        setHabits({
          smoking: data.habits.smoking as HabitLevel,
          alcohol: data.habits.alcohol as HabitLevel,
          sleep: data.habits.sleep as HabitLevel,
          exercise: data.habits.exercise as HabitLevel,
          diet: data.habits.diet as HabitLevel,
          stress: (data.habits.stress ?? 0) as HabitLevel,
          hydration: (data.habits.hydration ?? 0) as HabitLevel,
        });
      }

      if (data.biomarkers && typeof data.biomarkers === 'object') {
        setBiomarkers(prev => ({ ...prev, ...data.biomarkers }));
      }

      if (data.demographics && typeof data.demographics === 'object') {
        setDemographics(prev => ({ ...prev, ...data.demographics }));
      }

      let aiText = data.summary || 'Health data updated.';
      if (data.sources?.length > 0) {
        aiText += '\n📚 Sources: ' + data.sources.join(' · ');
      }
      if (data.bmi_note) {
        aiText += '\n📊 ' + data.bmi_note;
      }

      const changes: string[] = [];
      if (data.biomarkers) changes.push('biomarkers');
      if (data.demographics) changes.push('demographics');
      if (data.habits) changes.push('habits');
      if (changes.length > 0) {
        aiText += `\n✅ Updated: ${changes.join(', ')}`;
      }

      setChatMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to analyze. Try again.');
    } finally {
      setChatLoading(false);
    }
  }, [chatMessages, demographics, habits, biomarkers, setHabits, setBiomarkers, setDemographics, setChatMessages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    handleChat(chatInput.trim());
    setChatInput('');
  };

  

  return (
    <>
      {/* Chat Log Toggle */}
      {tabs.some(t => t.messages.length > 0) && (
        <section ref={logRef} className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setLogOpen(o => !o)}
            className="w-full px-5 py-3 border-b border-border flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="text-left">
              <h2 className="text-sm font-semibold text-foreground">AI Analysis Log</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Chat history and health insights from the AI</p>
            </div>
            {logOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
          </button>

          {logOpen && (
            <>
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-3 pt-3 pb-1 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                      tab.id === activeTabId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tabs.length > 1 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                          tab.id === activeTabId ? 'text-primary-foreground/70 hover:text-primary-foreground' : 'text-muted-foreground/70 hover:text-foreground'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={addNewTab}
                  className="shrink-0 h-7 w-7 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center transition-colors"
                  title="New chat"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 text-center py-4">No messages in this chat yet.</p>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        {msg.text.split('\n').map((line, j) => (
                          <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-xl px-4 py-2.5 text-sm animate-pulse">✦ Analyzing...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </section>
      )}

      {/* Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div ref={chatBarRef} className="max-w-[700px] mx-auto px-4 pb-5 pointer-events-auto">
          <AnimatePresence mode="wait">
            {chatOpen ? (
              <motion.div
                key="open"
                initial={{ y: 20, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="rainbow-aura rounded-2xl"
              >
                <div className="rounded-2xl bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                      </span>
                      AI Health Chat
                    </span>
                    <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 p-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder='Try: "I smoke daily and sleep 5 hours"'
                      disabled={chatLoading}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none px-2 py-1"
                      autoFocus
                    />
                    <button
                      onClick={sendMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="shrink-0 h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-all active:scale-95"
                    >
                      {chatLoading ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="closed"
                initial={{ y: 20, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => setChatOpen(true)}
                className="w-full rainbow-aura rounded-2xl"
              >
                <div className="rounded-2xl bg-card px-5 py-3.5 flex items-center gap-3 hover:bg-card/90 transition-colors cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-violet to-brand-pink text-primary-foreground flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm text-muted-foreground">Describe your habits to the AI...</span>
                  <div className="ml-auto flex items-center gap-1">
                    <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground font-mono">↵</kbd>
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
