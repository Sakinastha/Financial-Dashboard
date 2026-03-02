'use client';

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left side */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#111] border border-[#222] rounded flex items-center justify-center">
              <span className="text-[#2196f3] font-mono text-[10px] font-bold">F</span>
            </div>
            <p className="text-[10px] text-gray-600 font-mono">
              FinanceFlow Terminal
              <span className="text-gray-700 mx-2">|</span>
              SEC EDGAR Data
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 text-[10px] text-gray-600 font-mono">
            <span>Cat Rock Capital Assessment</span>
            <span className="text-gray-700">|</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
