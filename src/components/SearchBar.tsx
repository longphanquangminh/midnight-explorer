"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    const cleanQuery = query.trim();

    // Route based on input type
    if (/^\d+$/.test(cleanQuery)) {
      // Numeric input - treat as block height
      router.push(`/blocks/${cleanQuery}`);
    } else if (cleanQuery.length >= 40) {
      // Long string - likely a transaction hash
      router.push(`/txs/${cleanQuery}`);
    } else {
      // Otherwise treat as an address
      router.push(`/address/${cleanQuery}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search block height, hash, or address (coming soon)"
          className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    text-gray-200 placeholder-gray-500 transition-all"
          aria-label="Search the Midnight blockchain"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          type="submit"
          className="absolute right-2 p-2 text-gray-400 hover:text-purple-400 transition-colors"
          aria-label="Submit search"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
