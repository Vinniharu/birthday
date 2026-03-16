import Sidebar from "../../components/Sidebar";
import WishForm from "../../components/WishForm";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 md:p-12 shadow-2xl">
        <Sidebar />
        <WishForm />
      </div>
    </div>
  );
}
