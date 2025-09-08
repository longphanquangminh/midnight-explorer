import Link from 'next/link';
import { getProvider } from '@/lib/data';
import { formatDistanceToNow } from '@/lib/utils';
import { notFound } from 'next/navigation';

// Disable prerendering so network calls are executed at request time
export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: {
    cursor?: string;
  };
}

export default async function BlockTransactionsPage({ params, searchParams }: PageProps) {
  const provider = getProvider();
  const cursor = searchParams?.cursor;
  
  // First, verify the block exists
  const block = await provider.getBlockByHashOrHeight(params.id);
  
  // If block doesn't exist, show 404
  if (!block) {
    notFound();
  }
  
  // Fetch transactions for this block with pagination
  const { items: txs, nextCursor } = await provider.getBlockTransactions(params.id, cursor);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Block #{block.height} Transactions</h1>
          <p className="text-gray-400 mt-1">
            Showing {txs.length} transaction{txs.length !== 1 ? 's' : ''} 
            {cursor ? ` (page after ${cursor})` : ''}
          </p>
        </div>
        <div className="flex gap-4">
          <Link 
            href={`/blocks/${block.height}`} 
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Block
          </Link>
          <Link 
            href="/blocks" 
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← All Blocks
          </Link>
        </div>
      </div>
      
      {txs.length > 0 ? (
        <section className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700 grid grid-cols-12 text-sm font-medium text-gray-400">
            <div className="col-span-7">Hash</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Age</div>
            <div className="col-span-1 text-right">Size</div>
          </div>
          
          <div className="divide-y divide-gray-700">
            {txs.map(tx => (
              <div key={tx.hash} className="px-4 py-3 hover:bg-gray-700/30 transition-colors grid grid-cols-12 items-center">
                <div className="col-span-7">
                  <Link 
                    href={`/txs/${tx.hash}`}
                    className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span className="font-mono text-sm truncate block">
                      {tx.hash.substring(0, 32)}...
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
      ) : (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">No transactions found in this block.</p>
        </div>
      )}
      
      {nextCursor && (
        <div className="flex justify-end mt-4">
          <Link
            href={`/blocks/${block.height}/txs?cursor=${nextCursor}`}
            className="px-4 py-2 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 rounded-md transition-colors"
          >
            Next Page →
          </Link>
        </div>
      )}
    </div>
  );
}
