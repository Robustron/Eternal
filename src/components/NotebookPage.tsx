import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type Entry = {
  id: string;
  page: "pink" | "blue";
  content: string;
  locked: boolean;
  locked_at: string | null;
  created_at: string;
  day_key: string;
};

type Props = {
  side: "pink" | "blue";
  entries: Entry[];
  isOwner: boolean;
  dayKey: string;
  isToday: boolean;
  onChange: () => void;
};

const labels = {
  pink: { title: "her page", placeholder: "write something only she would write…" },
  blue: { title: "his page", placeholder: "write something only he would write…" },
};


function formatStamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function NotebookPage({ side, entries, isOwner, dayKey, isToday, onChange }: Props) {
  const isPink = side === "pink";
  const dayEntries = entries
    .filter((e) => e.page === side && e.day_key === dayKey)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const draft = dayEntries.find((e) => !e.locked);
  const lockedEntries = dayEntries.filter((e) => e.locked);
  const canWrite = isOwner && isToday;

  const [text, setText] = useState(draft?.content ?? "");
  const draftIdRef = useRef<string | null>(draft?.id ?? null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Reset local state when switching days.
  useEffect(() => {
    draftIdRef.current = draft?.id ?? null;
    if (document.activeElement !== taRef.current) {
      setText(draft?.content ?? "");
    }
  }, [draft?.id, draft?.content, dayKey]);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(ta.scrollHeight, 152) + "px";
  };
  useEffect(autosize, [text]);

  const persist = async (value: string) => {
    if (draftIdRef.current) {
      await supabase.from("entries").update({ content: value }).eq("id", draftIdRef.current);
    } else if (value.trim().length > 0) {
      const { data } = await supabase
        .from("entries")
        .insert({ page: side, content: value, locked: false, day_key: dayKey })
        .select("id")
        .single();
      if (data) draftIdRef.current = data.id;
    }
    onChange();
  };

  const handleChange = (v: string) => {
    setText(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(v), 600);
  };

  const lockForever = async () => {
    if (!text.trim()) return;
    if (!confirm("Seal these words forever? They can never be edited or deleted.")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (draftIdRef.current) {
      await supabase.from("entries").update({ content: text, locked: true }).eq("id", draftIdRef.current);
    } else {
      await supabase.from("entries").insert({ page: side, content: text, locked: true, day_key: dayKey });
    }
    draftIdRef.current = null;
    setText("");
    onChange();
  };


  const inkColor = isPink ? "var(--ink-pink)" : "var(--ink-blue)";
  const paperBg = isPink
    ? "linear-gradient(135deg, var(--paper-pink) 0%, var(--paper-pink-deep) 100%)"
    : "linear-gradient(135deg, var(--paper-blue) 0%, var(--paper-blue-deep) 100%)";

  return (
    <div
      className={`paper-texture paper-lines relative h-full w-full overflow-hidden ${
        isPink ? "page-shadow-left rounded-l-[14px] md:rounded-r-none rounded-r-[14px]" : "page-shadow-right rounded-r-[14px] md:rounded-l-none rounded-l-[14px]"
      }`}
      style={{ background: paperBg, color: inkColor }}
    >
      <div className="relative z-10 h-full overflow-y-auto px-8 py-10 md:px-14 md:py-14">
        {/* page header */}
        <div className="mb-6 flex items-baseline justify-between">
          <h2 style={{ fontFamily: "var(--font-fancy)" }} className="text-3xl md:text-4xl opacity-80">
            {labels[side].title}
          </h2>
          <span className="text-xs italic opacity-50" style={{ fontFamily: "var(--font-serif)" }}>
            {isPink ? "left page" : "right page"}
          </span>
        </div>

        {/* locked entries — permanent memories */}
        <div className="space-y-7">
          {lockedEntries.map((e) => (
            <div key={e.id} className="ink-in">
              <div className="locked-text" style={{ color: inkColor, opacity: 0.92 }}>
                {e.content}
              </div>
              <div
                className="mt-2 flex items-center gap-2 text-[11px] italic opacity-55"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                <Lock className="h-3 w-3" />
                sealed · {e.locked_at ? formatStamp(e.locked_at) : formatStamp(e.created_at)}
              </div>
              <div
                className="mt-6 h-px"
                style={{ background: "currentColor", opacity: 0.12 }}
              />
            </div>
          ))}
        </div>

        {/* live writing area */}
        <div className="mt-6">
          {canWrite ? (
            <>
              <textarea
                ref={taRef}
                className="notebook-writer"
                style={{ color: inkColor }}
                value={text}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={labels[side].placeholder}
                spellCheck={false}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] italic opacity-50" style={{ fontFamily: "var(--font-serif)" }}>
                  {text.trim() ? "saving softly…" : "auto-saves as you write"}
                </span>
                <button
                  onClick={lockForever}
                  disabled={!text.trim()}
                  className="group inline-flex items-center gap-2 rounded-full border border-current/30 px-4 py-1.5 text-[12px] italic transition-opacity disabled:opacity-30 hover:opacity-100"
                  style={{ fontFamily: "var(--font-serif)", color: inkColor, opacity: 0.7 }}
                >
                  <Lock className="h-3 w-3" />
                  seal forever
                </button>
              </div>
            </>
          ) : draft ? (
            <div className="locked-text opacity-80" style={{ color: inkColor }}>
              {draft.content}
              <span
                className="ml-1 inline-block h-5 w-[2px] align-middle"
                style={{ background: inkColor, animation: "caret-glow 1.4s ease-in-out infinite" }}
              />
            </div>
          ) : (
            <p className="italic opacity-40" style={{ fontFamily: "var(--font-serif)" }}>
              waiting for {isPink ? "her" : "him"} to write…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
