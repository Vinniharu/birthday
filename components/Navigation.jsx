"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Camera, Settings } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  // Hide the navigation entirely on the home page (the Tribute Landing Page)
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-100 w-full backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/"
              className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xl hover:opacity-80 transition-opacity"
            >
              <span className="bg-blue-600 text-white p-1 rounded-lg">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              <span>Storyboard</span>
            </Link>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link
              href="/upload"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Add Wish</span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
