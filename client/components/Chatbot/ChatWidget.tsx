import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFirebase } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm FoodLink Assistant. I can help you create a post, find nearby food, or answer FAQs.",
    },
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
  }, [messages, open]);

  const getSessionId = () => {
    const key = "foodlink_session_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
      localStorage.setItem(key, id);
    }
    return id;
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const reply = data?.reply ?? "I'm having trouble responding right now.";

      setMessages((m) => [...m, { role: "assistant", content: reply }]);

      // Firestore logging (errors won't break chat)
      const { db } = getFirebase();
      if (db) {
        addDoc(collection(db, "ChatbotLogs"), {
          sessionId: getSessionId(),
          userId: null,
          message: content,
          response: reply,
          timestamp: serverTimestamp(),
          intent: data?.intent ?? null,
        }).catch(console.error);
      }
    } catch (err) {
      console.error("Chat fetch error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the assistant. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm FoodLink Assistant. I can help you create a post, find nearby food, or answer FAQs.",
      },
    ]);
    localStorage.removeItem("foodlink_session_id");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-[min(92vw,380px)] rounded-xl border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="size-6 rounded-md bg-gradient-to-br from-emerald-400 to-lime-500"
                aria-hidden
              />
              <div className="font-semibold">FoodLink Assistant</div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleClose}>
              Close
            </Button>
          </div>

          <div
            ref={containerRef}
            className="max-h-[50vh] overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm",
                  m.role === "user" ? "text-right" : "text-left"
                )}
              >
                <div
                  className={cn(
                    "inline-block rounded-lg px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-muted-foreground">
                Assistant is typing…
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2 mb-2">
              <QuickAction onClick={() => sendMessage("Create a post")}>
                Create a post
              </QuickAction>
              <QuickAction onClick={() => sendMessage("Show nearby posts")}>
                Nearby posts
              </QuickAction>
              <QuickAction onClick={() => sendMessage("How FoodLink works?")}>
                How it works
              </QuickAction>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Ask me anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Chat message input"
              />
              <Button type="submit" disabled={loading}>
                Send
              </Button>
            </form>
          </div>
        </div>
      )}

      <Button
        className="shadow-lg"
        size="lg"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle chat assistant"
      >
        {open ? "Hide Chat" : "Chat"}
      </Button>
    </div>
  );
}

function QuickAction({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {children}
    </button>
  );
}
