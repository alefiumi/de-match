export function Footer() {
  return (
    <footer className="max-w-5xl mx-auto px-5 py-8 mt-4">
      <hr className="divider mb-6" />
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
        <p className="text-slate-600 text-xs">
          De-Match Protocol © {new Date().getFullYear()} — Hackathon Demo Build. Not financial advice.
        </p>
        <div className="flex gap-4">
          <span className="text-slate-600 text-xs">Powered by Gemini Flash</span>
          <span className="text-slate-700 text-xs">|</span>
          <span className="text-slate-600 text-xs">EVM Testnet (Simulated)</span>
        </div>
      </div>
    </footer>
  );
}
