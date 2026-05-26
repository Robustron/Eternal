import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = { onChoose: (side: "pink" | "blue") => void };

export function SideChooser({ onChoose }: Props) {
  const [selectedSide, setSelectedSide] = useState<"pink" | "blue" | null>(null);
  const [password, setPassword] = useState("");
  const [isClaimed, setIsClaimed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!selectedSide) return;
    const checkClaim = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("entries")
        .select("content")
        .eq("page", `system_claim_${selectedSide}`)
        .single();
      
      setIsClaimed(!!data);
      setLoading(false);
    };
    checkClaim();
  }, [selectedSide]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSide || !password.trim()) return;
    setLoading(true);

    if (isClaimed) {
      // Verify
      const { data } = await supabase
        .from("entries")
        .select("content")
        .eq("page", `system_claim_${selectedSide}`)
        .single();
      
      if (data && data.content === password.trim()) {
        onChoose(selectedSide);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPassword("");
      }
    } else {
      // Claim
      await supabase.from("entries").insert({
        page: `system_claim_${selectedSide}`,
        content: password.trim(),
        locked: true,
        day_key: "system"
      });
      onChoose(selectedSide);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
         style={{ background: "oklch(0.18 0.02 30 / 0.55)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md text-center text-[color:var(--primary-foreground)]">
        
        {!selectedSide ? (
          <>
            <p className="mb-3 text-sm uppercase tracking-[0.3em] opacity-70"
               style={{ fontFamily: "var(--font-serif)" }}>
              before you open the notebook
            </p>
            <h1 className="mb-2 text-5xl" style={{ fontFamily: "var(--font-fancy)" }}>
              which page is yours?
            </h1>
            <p className="mb-10 italic opacity-70" style={{ fontFamily: "var(--font-serif)" }}>
              one of you writes in pink, the other in blue. forever.
            </p>
            <div className="flex gap-5">
              <button
                onClick={() => setSelectedSide("pink")}
                className="flex-1 rounded-2xl p-8 transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, var(--paper-pink), var(--paper-pink-deep))", color: "var(--ink-pink)" }}
              >
                <div style={{ fontFamily: "var(--font-fancy)" }} className="text-3xl">pink</div>
                <div className="mt-1 text-xs italic opacity-70">left page</div>
              </button>
              <button
                onClick={() => setSelectedSide("blue")}
                className="flex-1 rounded-2xl p-8 transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, var(--paper-blue), var(--paper-blue-deep))", color: "var(--ink-blue)" }}
              >
                <div style={{ fontFamily: "var(--font-fancy)" }} className="text-3xl">blue</div>
                <div className="mt-1 text-xs italic opacity-70">right page</div>
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="flex flex-col items-center">
            <h1 className="mb-2 text-5xl" style={{ fontFamily: "var(--font-fancy)" }}>
              {isClaimed === null ? "..." : isClaimed ? `unlock ${selectedSide}` : `claim ${selectedSide}`}
            </h1>
            <p className="mb-8 italic opacity-70" style={{ fontFamily: "var(--font-serif)" }}>
              {isClaimed 
                ? "enter your secret password to continue." 
                : "set a permanent secret password for this page."}
            </p>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || isClaimed === null}
              placeholder="…"
              className="w-full max-w-[240px] rounded-full border border-white/20 bg-white/5 px-5 py-3 text-center italic outline-none transition focus:border-white/50"
              style={{
                fontFamily: "var(--font-serif)",
                animation: shake ? "shake 0.4s" : undefined,
              }}
            />
            <button 
              type="button" 
              onClick={() => { setSelectedSide(null); setPassword(""); setIsClaimed(null); }}
              className="mt-6 text-xs italic opacity-50 hover:opacity-100"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              go back
            </button>
          </form>
        )}
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
    </div>
  );
}
