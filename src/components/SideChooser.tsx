type Props = { onChoose: (side: "pink" | "blue") => void };

export function SideChooser({ onChoose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
         style={{ background: "oklch(0.18 0.02 30 / 0.55)", backdropFilter: "blur(6px)" }}>
      <div className="max-w-md text-center text-[color:var(--primary-foreground)]">
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
            onClick={() => onChoose("pink")}
            className="flex-1 rounded-2xl p-8 transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, var(--paper-pink), var(--paper-pink-deep))", color: "var(--ink-pink)" }}
          >
            <div style={{ fontFamily: "var(--font-fancy)" }} className="text-3xl">pink</div>
            <div className="mt-1 text-xs italic opacity-70">left page</div>
          </button>
          <button
            onClick={() => onChoose("blue")}
            className="flex-1 rounded-2xl p-8 transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, var(--paper-blue), var(--paper-blue-deep))", color: "var(--ink-blue)" }}
          >
            <div style={{ fontFamily: "var(--font-fancy)" }} className="text-3xl">blue</div>
            <div className="mt-1 text-xs italic opacity-70">right page</div>
          </button>
        </div>
      </div>
    </div>
  );
}
