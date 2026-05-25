import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NotebookPage, type Entry } from "@/components/NotebookPage";
import { SideChooser } from "@/components/SideChooser";
import { addDays, formatDayLabel, msUntilNext2AM, todayKey } from "@/lib/day";
import { PasswordGate } from "@/components/PasswordGate";


export const Route = createFileRoute("/")({
  component: NotebookHome,
});

const STORAGE_KEY = "notebook.side";

function NotebookHome() {
  const [side, setSide] = useState<"pink" | "blue" | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [intro, setIntro] = useState(true);
  const [mobilePage, setMobilePage] = useState<"pink" | "blue">("pink");
  const START_DATE = "2026-05-25";
  const [today, setToday] = useState(todayKey());
  const [viewDay, setViewDay] = useState(todayKey() < START_DATE ? START_DATE : todayKey());

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

  // Roll over at next 2 AM
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const k = todayKey();
        setToday(k);
        setViewDay((v) => (v === today ? k : v));
        schedule();
      }, msUntilNext2AM() + 1000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [today]);

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

  const isToday = viewDay === today;

  // Earliest day is START_DATE, or earlier if entries exist
  const earliestDay = useMemo(() => {
    let minDay = START_DATE;
    for (const e of entries) {
      if (e.day_key < minDay) minDay = e.day_key;
    }
    return minDay;
  }, [entries]);

  const canGoBack = viewDay > earliestDay;
  const canGoForward = true; // Always allow going forward to future pages

  const goBack = () => canGoBack && setViewDay((d) => addDays(d, -1));
  const goForward = () => canGoForward && setViewDay((d) => addDays(d, 1));

  // Swipe handlers
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) goForward(); // swipe left = forward in time
    else goBack();           // swipe right = back in time
  };

  return (
    <PasswordGate>
    <main className="min-h-screen w-full">

      {/* Tiny intro */}
      {intro && (
        <div
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: "oklch(0.92 0.025 50)", animation: "ink-in 0.6s ease-out, fadeout 0.8s ease 1.5s forwards" }}
        >
          <p style={{ fontFamily: "var(--font-fancy)" }} className="text-3xl md:text-5xl opacity-70">
            some words deserve forever.
          </p>
          <style>{`@keyframes fadeout { to { opacity: 0; visibility: hidden; } }`}</style>
        </div>
      )}

      {/* Side chooser */}
      {!intro && !side && <SideChooser onChoose={chooseSide} />}

      {/* Day header */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-30 flex items-center justify-center pt-3">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-black/15 px-3 py-1.5 text-[color:var(--primary-foreground)] backdrop-blur">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="rounded-full p-1 opacity-70 transition disabled:opacity-20 hover:opacity-100"
            aria-label="previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[8rem] text-center text-sm italic" style={{ fontFamily: "var(--font-serif)" }}>
            {formatDayLabel(viewDay)}
          </span>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className="rounded-full p-1 opacity-70 transition disabled:opacity-20 hover:opacity-100"
            aria-label="next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notebook */}
      <div className="relative w-full h-screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="relative w-full h-full">
          {/* Desktop: two pages side-by-side */}
          <div className="absolute inset-0 hidden md:grid grid-cols-2">
            <NotebookPage
              side="pink"
              entries={entries}
              isOwner={side === "pink"}
              dayKey={viewDay}
              isToday={isToday}
              onChange={load}
            />
            <NotebookPage
              side="blue"
              entries={entries}
              isOwner={side === "blue"}
              dayKey={viewDay}
              isToday={isToday}
              onChange={load}
            />
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 center-fold" />
          </div>

          {/* Mobile */}
          <div className="absolute inset-0 md:hidden">
            <div className="relative h-full">
              <div key={`${mobilePage}-${viewDay}`} className="h-full ink-in">
                <NotebookPage
                  side={mobilePage}
                  entries={entries}
                  isOwner={side === mobilePage}
                  dayKey={viewDay}
                  isToday={isToday}
                  onChange={load}
                />
              </div>
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
    </PasswordGate>
  );

}
