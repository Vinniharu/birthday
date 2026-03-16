"use client";

import { useState, useEffect } from "react";
import { db, storage } from "../../lib/firebase.config";
import {
  ref as dbRef,
  onValue,
  remove,
  query as dbQuery,
  orderByChild,
} from "firebase/database";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPage() {
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let unsubscribe;
    try {
      const wishesRef = dbRef(db, "wishes");

      // onValue listens for real-time changes
      unsubscribe = onValue(
        wishesRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // RTDB returns an object of objects. Convert to array and sort by time descending
            const wishesArray = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));

            wishesArray.sort((a, b) => b.timestamp - a.timestamp);
            setWishes(wishesArray);
          } else {
            setWishes([]);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Admin fetch error: ", err);
          setError(
            "Could not load messages. Check Firebase configuration and permissions.",
          );
          setLoading(false);
        },
      );
    } catch (err) {
      setError("Firebase environment variables are missing.");
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDelete = async (wish) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the wish from ${wish.name}?`,
      )
    ) {
      return;
    }

    setDeletingId(wish.id);
    try {
      // 1. Delete the node from Realtime Database
      await remove(dbRef(db, `wishes/${wish.id}`));

      // 2. If there's an image, attempt to delete it from Storage
      if (wish.imageUrl) {
        try {
          // Extract the path from the download URL (basic parsing for default Firebase Storage URLs)
          const urlObj = new URL(wish.imageUrl);
          const pathPath = decodeURIComponent(urlObj.pathname.split("/o/")[1]);
          if (pathPath) {
            const fileRef = storageRef(storage, pathPath);
            await deleteObject(fileRef);
          }
        } catch (storageErr) {
          console.error("Failed to delete image from storage:", storageErr);
          // We don't throw here because the main goal is removing it from the UI (Firestore)
        }
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error("Failed to delete wish. Check your security rules.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Manage storyboard contributions
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 flex items-center">
            <AlertCircle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Guest Name
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Message
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Has Image?
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Date/Time
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {wishes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No wishes found.
                    </td>
                  </tr>
                ) : (
                  wishes.map((wish) => (
                    <tr
                      key={wish.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {wish.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-sm truncate">
                        {wish.message}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {wish.imageUrl ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                            Yes
                          </span>
                        ) : (
                          "No"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {wish.timestamp
                          ? new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                            }).format(new Date(wish.timestamp))
                          : "Just now"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(wish)}
                          disabled={deletingId === wish.id}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                          title="Delete Wish"
                        >
                          {deletingId === wish.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
