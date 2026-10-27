import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../Constants";

const SITE_SUGGESTIONS = [
  "How do I edit my profile?",
  "How do I change my avatar?",
  "How do contests work?",
];

const PROBLEM_SUGGESTIONS = [
  "What is this problem asking?",
  "Give me a hint",
  "How do I submit an answer?",
];

function parseEvent(rawBlock) {
  let event = "message";
  const dataLines = [];
  for (const line of rawBlock.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  return { event, data: dataLines.join("\n") };
}

/**
 * "Ask Beside" chat panel. The conversation lives in component state and the last few turns
 * are sent with every request, so the backend stays stateless.
 */
const AssistantPanel = ({ problemId = null }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streamText, setStreamText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null);
  const [configured, setConfigured] = useState(true);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}api/assistant/status`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setConfigured(Boolean(data.configured));
        }
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, streamText, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const suggestions = problemId ? PROBLEM_SUGGESTIONS : SITE_SUGGESTIONS;

  const send = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || busy) return;

    const history = messages
      .slice(-8)
      .map((item) => ({
        role: item.role === "user" ? "user" : "assistant",
        content: item.content,
      }));

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setError("");
    setStreamText("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let collected = "";

    try {
      const res = await fetch(`${API_BASE_URL}api/assistant/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, problemId, history }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        throw new Error("Please sign in again to use Ask Beside.");
      }
      if (!res.ok || !res.body) {
        let message = `Request failed (${res.status})`;
        try {
          const data = await res.json();
          message = data.message || message;
        } catch {
          // keep the status message
        }
        throw new Error(message);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          if (!block.trim()) continue;
          const { event, data } = parseEvent(block);
          if (!data) continue;

          let payload = data;
          try {
            payload = JSON.parse(data);
          } catch {
            // plain text payload
          }

          if (event === "meta" && payload && typeof payload === "object") {
            setMeta(payload);
          } else if (event === "token") {
            collected += payload;
            setStreamText(collected);
          } else if (event === "blocked" && payload && typeof payload === "object") {
            setMessages((prev) => [...prev, { role: "assistant", content: payload.message }]);
            setMeta((prevMeta) => ({ ...(prevMeta || {}), locked: true }));
          } else if (event === "error" && payload && typeof payload === "object") {
            setError(payload.message || "The assistant could not answer.");
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "The assistant could not answer.");
      }
    } finally {
      if (collected.trim()) {
        setMessages((prev) => [...prev, { role: "assistant", content: collected }]);
      }
      setStreamText("");
      setBusy(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const close = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#34ad48] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2c9440]"
        aria-label="Open Ask Beside"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 1 1 21 12Z" />
        </svg>
        Ask Beside
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-neutral-700 bg-[#1e1e1e] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-neutral-700 bg-[#2d2d2d] px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Ask Beside</p>
          <p className="truncate text-[11px] text-neutral-400">
            {meta?.locked
              ? "Contest lock: site questions only"
              : meta?.problemTitle
                ? `About: ${meta.problemTitle}`
                : problemId
                  ? "Site help and problem hints"
                  : "Site help"}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          className="rounded p-1 text-neutral-400 transition hover:bg-neutral-700 hover:text-white"
          aria-label="Close Ask Beside"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex max-h-[55vh] min-h-[240px] flex-col gap-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !streamText && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">
              {problemId
                ? "Ask about this problem, or about how the site works."
                : "Ask about how to use besideCoding."}
            </p>
            {!configured && (
              <p className="rounded border border-yellow-700/60 bg-yellow-900/20 p-2 text-[11px] text-yellow-300">
                The assistant is not configured on this server yet.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  disabled={busy || !configured}
                  className="rounded-md border border-neutral-700 bg-[#252526] px-3 py-2 text-left text-xs text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
              message.role === "user"
                ? "ml-8 bg-[#34ad48]/20 border border-[#34ad48]/40"
                : "mr-4 bg-[#252526] border border-neutral-700"
            }`}
          >
            {message.content}
          </div>
        ))}

        {streamText && (
          <div className="mr-4 whitespace-pre-wrap rounded-lg border border-neutral-700 bg-[#252526] px-3 py-2 text-[13px] leading-relaxed">
            {streamText}
            <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-neutral-400 align-text-bottom" />
          </div>
        )}

        {busy && !streamText && (
          <p className="text-xs text-neutral-500">Thinking...</p>
        )}

        {error && (
          <p className="rounded border border-red-800/60 bg-red-900/20 px-2 py-1.5 text-[11px] text-red-300">
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-neutral-700 p-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={configured ? "Ask a question..." : "Assistant not configured"}
            disabled={busy || !configured}
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-md border border-neutral-700 bg-[#252526] px-3 py-2 text-[13px] text-white placeholder-neutral-500 outline-none focus:border-[#34ad48] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={busy || !configured || !input.trim()}
            className="rounded-md bg-[#34ad48] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#2c9440] disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            Send
          </button>
        </div>
        <p className="mt-1 text-[10px] text-neutral-500">
          Hints are unavailable for problems in a live contest.
        </p>
      </div>
    </div>
  );
};

export default AssistantPanel;
