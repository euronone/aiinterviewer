"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInterviewWebSocketUrl } from "@/services/api";
import { Video, Mic, MessageSquare } from "lucide-react";

export default function InterviewRoomPage() {
  const params = useParams();
  const interviewId = params.interviewId as string;
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = getInterviewWebSocketUrl(interviewId);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "agent_response" && data.text) {
          setMessages((m) => [...m, { role: "assistant", text: data.text }]);
        }
      } catch {
        setMessages((m) => [...m, { role: "assistant", text: event.data }]);
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [interviewId]);

  const send = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "user_input", text: input.trim() }));
    setMessages((m) => [...m, { role: "user", text: input.trim() }]);
    setInput("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Interview</span>
          {connected ? (
            <span className="text-xs text-green-600 font-medium">Live</span>
          ) : (
            <span className="text-xs text-muted-foreground">Connecting...</span>
          )}
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">Leave</Button>
        </Link>
      </header>
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4">
        <div className="flex-1 overflow-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" && <MessageSquare className="h-3 w-3 inline mr-1 opacity-70" />}
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Type your answer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button onClick={send} disabled={!connected || !input.trim()}>
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Say &quot;next&quot; or &quot;done&quot; to move to the next round (Intro → Technical → HR → Salary).
        </p>
      </div>
    </div>
  );
}
