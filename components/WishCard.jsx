"use client";

import { motion } from "framer-motion";

export default function WishCard({ wish, index }) {
  const { name, message, imageUrl, timestamp } = wish;

  // Format the date nicely if it exists
  const formattedDate = timestamp?.toDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      }).format(timestamp.toDate())
    : "Just now";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index ? Math.min(index * 0.1, 1.5) : 0, // Stagger initial render, cap delay
      }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden break-inside-avoid mb-4 md:mb-6 transition-all"
    >
      {imageUrl && (
        <div className="w-full relative bg-slate-100 dark:bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`Photo from ${name}`}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5">
        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-4 text-base">
          "{message}"
        </p>
        <div className="flex items-center justify-between mt-auto">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {formattedDate}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
