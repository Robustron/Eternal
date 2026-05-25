import { useEffect, useState } from "react";

const KEY = "notebook.unlocked";
const PASSWORD = "till the eternity";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "1") setUnlocked(true);
    setReady(true);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().toLowerCase() === PASSWORD) {
      localStorage.setItem(KEY, "1");
      setUnlocked(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setValue("");
    }
  };

  if (!ready) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: "oklch(0.16 0.02 30)" }}
    >
      <form onSubmit={submit} className="w-full max-w-sm text-center text-[color:var(--primary-foreground)]">
        <p className="mb-2 text-xs uppercase tracking-[0.35em] opacity-60" style={{ fontFamily: "var(--font-serif)" }}>
          a private notebook
        </p>
        <h1 className="mb-8 text-4xl md:text-5xl" style={{ fontFamily: "var(--font-fancy)" }}>
          whisper the words
        </h1>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="…"
          className="w-full rounded-full border border-white/20 bg-white/5 px-5 py-3 text-center italic outline-none transition focus:border-white/50"
          style={{
            fontFamily: "var(--font-serif)",
            animation: shake ? "shake 0.4s" : undefined,
          }}
        />
        <p className="mt-6 text-xs italic opacity-40" style={{ fontFamily: "var(--font-serif)" }}>
          only the two of you know.
        </p>
        <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
      </form>
    </div>
  );
}
