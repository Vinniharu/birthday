import { PartyPopper } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="mb-8">
      <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl mb-6">
        <PartyPopper className="w-8 h-8" />
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
        Mr Ezekiel's Birthday
      </h1>

      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        Welcome to the digital storyboard! Leave a birthday wish or share a fun
        memory. Everything updates here in real-time.
      </p>

      <div className="w-full h-px bg-linear-to-r from-slate-200 via-slate-300 to-transparent dark:from-slate-800 dark:via-slate-700 dark:to-transparent"></div>
    </div>
  );
}
