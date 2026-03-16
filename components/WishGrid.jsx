"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase.config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import WishCard from "./WishCard";
import { Loader2, MessageSquareOff } from "lucide-react";

export default function WishGrid() {
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Setup Firestore listener
    let unsubscribe;

    try {
      const q = query(collection(db, "wishes"), orderBy("timestamp", "desc"));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const wishesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setWishes(wishesData);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching wishes: ", err);
          setError(
            "Could not load messages. Make sure Firebase is configured properly.",
          );
          setLoading(false);
        },
      );
    } catch (err) {
      console.error("Firebase setup error: ", err);
      // Fallback state if firebase is not configured
      setError(
        "Firebase environment variables are missing. Please configure them in .env.local",
      );
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="font-medium animate-pulse">Loading wishes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-400 text-center">
        <p className="font-medium">{error}</p>
        <p className="text-sm mt-2 opacity-80">
          Check your console for more details. If you just set up the project,
          make sure you've added the Firebase credentials to{" "}
          <code>.env.local</code>.
        </p>
      </div>
    );
  }

  if (wishes.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <MessageSquareOff className="w-12 h-12 opacity-50" />
        <p className="font-medium text-lg">No wishes yet.</p>
        <p className="text-sm">Be the first to leave a message!</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {wishes.map((wish, index) => (
        <WishCard key={wish.id} wish={wish} index={index} />
      ))}
    </div>
  );
}
