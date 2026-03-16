"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/firebase.config";
import { ref as dbRef, push, set, serverTimestamp } from "firebase/database";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function WishForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("Name and message are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save Document to Realtime Database
      const wishesRef = dbRef(db, "wishes");
      const newWishRef = push(wishesRef);
      await set(newWishRef, {
        name: name.trim(),
        message: message.trim(),
        timestamp: serverTimestamp(),
      });

      toast.success("Your wish has been added! Redirecting...");

      // Reset Form
      setName("");
      setMessage("");

      // Redirect to the landing page to see the newly added wish
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Error adding wish: ", err);
      toast.error(err.message || "Failed to submit wish. Please try again.");
      setIsSubmitting(false); // Only set false on error so the button stays locked during redirect
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-all">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
        Leave a Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
          >
            Your Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            placeholder="John Doe"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
          >
            Birthday Wish *
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
            placeholder="Happy birthday! Wishing you..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send Wish</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
