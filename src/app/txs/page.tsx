import Link from 'next/link';
import { getProvider } from '@/lib/data';
import { formatDistanceToNow } from '@/lib/utils';

// Disable prerendering so network calls are executed at request time
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: {
    cursor?: string;
  };
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const provider = getProvider();
  const cursor = searchParams?.cursor;

  // Fetch transactions with pagination
  const { items: txs, nextCursor } = await provider.getTransactionsPage(cursor);

  // Pagination helpers ----------------------------------------------------
  const pageSize = 20;
  const current = cursor ? parseInt(cursor, 10) : 0;
  const prevCursor = current - pageSize;
  const prevHref = prevCursor > 0 ? `/txs?cursor=${prevCursor}` : '/txs';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <div className="text-sm text-gray-400">
          {cursor ? `Page after ${cursor}` : 'Latest transactions'}
        </div>
      </div>

      <section className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700 grid grid-cols-12 text-sm font-medium text-gray-400">
          <div className="col-span-5">Hash</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Block</div>
          <div className="col-span-2">Age</div>
          <div className="col-span-1 text-right">Size</div>
        </div>

        <div className="divide-y divide-gray-700">
          {txs.map((tx, index) => (
            <div key={`${tx.hash}-${index}`} className="px-4 py-3 hover:bg-gray-700/30 transition-colors grid grid-cols-12 items-center">
              <div className="col-span-5">
                <Link
                  href={`/txs/${tx.hash}`}
                  className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <span className="font-mono text-sm truncate block">
                    {tx.hash.substring(0, 24)}...
                  </span>
                </Link>
              </div>
              <div className="col-span-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  tx.status === 'success'
                    ? 'bg-green-900/30 text-green-300'
                    : tx.status === 'failed'
                      ? 'bg-red-900/30 text-red-300'
                      : 'bg-yellow-900/30 text-yellow-300'
                }`}>
                  {tx.status}
                </span>
              </div>
              <div className="col-span-2">
                {tx.blockHeight ? (
                  <Link
                    href={`/blocks/${tx.blockHeight}`}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    #{tx.blockHeight}
                  </Link>
                ) : (
                  <span className="text-gray-500">Pending</span>
                )}
              </div>
              <div className="col-span-2 text-gray-400 text-sm">
                {tx.timestamp ? (
                  `${formatDistanceToNow(new Date(tx.timestamp))} ago`
                ) : (
                  'N/A'
                )}
              </div>
              <div className="col-span-1 text-right text-gray-400 text-sm">
                {tx.size ? `${tx.size} B` : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-between mt-4">
        <div>
          {current > 0 && (
            <Link
              href={prevHref}
              className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 rounded-md transition-colors"
            >
              ← Previous
            </Link>
          )}
        </div>
        <div>
          {nextCursor && (
            <Link
              href={`/txs?cursor=${nextCursor}`}
              className="px-4 py-2 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 rounded-md transition-colors"
            >
              Next Page →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
