import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotebookPage, type Entry } from "@/components/NotebookPage";
import { SideChooser } from "@/components/SideChooser";

export const Route = createFileRoute("/")({
  component: NotebookHome,
});

const STORAGE_KEY = "notebook.side";

function NotebookHome() {
  const [side, setSide] = useState<"pink" | "blue" | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [intro, setIntro] = useState(true);
  const [mobilePage, setMobilePage] = useState<"pink" | "blue">("pink");

  // Restore chosen side
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "pink" || stored === "blue") {
      setSide(stored);
      setMobilePage(stored);
    }
    const t = setTimeout(() => setIntro(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const chooseSide = (s: "pink" | "blue") => {
    localStorage.setItem(STORAGE_KEY, s);
    setSide(s);
    setMobilePage(s);
  };

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setEntries(data as Entry[]);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("entries-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "entries" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <main className="min-h-screen w-full">
      {/* Tiny intro */}
      {intro && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
             style={{ background: "oklch(0.92 0.025 50)", animation: "ink-in 0.6s ease-out, fadeout 0.8s ease 1.5s forwards" }}>
          <p style={{ fontFamily: "var(--font-fancy)" }} className="text-3xl md:text-5xl opacity-70">
            some words deserve forever.
          </p>
          <style>{`@keyframes fadeout { to { opacity: 0; visibility: hidden; } }`}</style>
        </div>
      )}

      {/* Side chooser */}
      {!intro && !side && <SideChooser onChoose={chooseSide} />}

      {/* Notebook */}
      <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-center justify-center p-3 md:p-8">
        <div className="breathe relative w-full" style={{ aspectRatio: "16 / 10", maxHeight: "92vh" }}>
          {/* Desktop: two pages side-by-side */}
          <div className="absolute inset-0 hidden md:grid grid-cols-2">
            <NotebookPage
              side="pink"
              entries={entries}
              isOwner={side === "pink"}
              onChange={load}
            />
            <NotebookPage
              side="blue"
              entries={entries}
              isOwner={side === "blue"}
              onChange={load}
            />
            {/* center fold */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 center-fold" />
          </div>

          {/* Mobile: swipeable single page */}
          <div className="absolute inset-0 md:hidden">
            <div className="relative h-full">
              <div
                key={mobilePage}
                className="h-full ink-in"
              >
                <NotebookPage
                  side={mobilePage}
                  entries={entries}
                  isOwner={side === mobilePage}
                  onChange={load}
                />
              </div>
              {/* Page switcher */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 rounded-full bg-black/20 px-3 py-1.5 backdrop-blur">
                <button
                  onClick={() => setMobilePage("pink")}
                  className="h-2.5 w-2.5 rounded-full transition-opacity"
                  style={{ background: "var(--paper-pink-deep)", opacity: mobilePage === "pink" ? 1 : 0.5 }}
                  aria-label="pink page"
                />
                <button
                  onClick={() => setMobilePage("blue")}
                  className="h-2.5 w-2.5 rounded-full transition-opacity"
                  style={{ background: "var(--paper-blue-deep)", opacity: mobilePage === "blue" ? 1 : 0.5 }}
                  aria-label="blue page"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
