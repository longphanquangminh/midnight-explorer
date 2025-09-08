"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl mt-16 bg-red-900/20 border border-red-800 text-red-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm mb-4">An error occurred while rendering this page. Try again.</p>
      {error?.digest && (
        <p className="text-xs text-red-300/80 mb-4">Digest: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-800/60 hover:bg-red-700/60 rounded-md text-sm"
      >
        Retry
      </button>
    </div>
  );
}
