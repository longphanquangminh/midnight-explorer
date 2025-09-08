import Link from 'next/link';
import { getProvider } from '@/lib/data';
import { formatDistanceToNow } from '@/lib/utils';

// Disable prerendering so we don't call network APIs at build time
export const dynamic = 'force-dynamic';

export default async function Page() {
  const provider = getProvider();
  
  // Fetch latest blocks and transactions in parallel
  const [blocks, txs] = await Promise.all([
    provider.getLatestBlocks(10),
    provider.getLatestTransactions(10),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-6">Midnight Blockchain Explorer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latest Blocks Card */}
        <section className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Latest Blocks</h2>
            <Link 
              href="/blocks" 
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          
          <div className="divide-y divide-gray-700">
            {blocks.map(block => (
              <div key={block.hash} className="px-4 py-3 hover:bg-gray-700/30 transition-colors">
                <div className="flex justify-between items-start">
                  <Link 
                    href={`/blocks/${block.height}`}
                    className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    #{block.height}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(block.timestamp))} ago
                  </span>
                </div>
                <div className="mt-1 flex justify-between items-center">
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                    {block.hash}
                  </div>
                  <div className="text-xs px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded">
                    {block.txCount} txs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Latest Transactions Card */}
        <section className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Latest Transactions</h2>
            <Link 
              href="/txs" 
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          
          <div className="divide-y divide-gray-700">
            {txs.map(tx => (
              <div key={tx.hash} className="px-4 py-3 hover:bg-gray-700/30 transition-colors">
                <div className="flex justify-between items-start">
                  <Link 
                    href={`/txs/${tx.hash}`}
                    className="font-medium text-purple-400 hover:text-purple-300 transition-colors truncate max-w-[200px]"
                  >
                    {tx.hash.substring(0, 16)}...
                  </Link>
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
                <div className="mt-1 flex justify-between items-center">
                  {tx.blockHeight ? (
                    <Link 
                      href={`/blocks/${tx.blockHeight}`}
                      className="text-xs text-gray-400 hover:text-gray-300"
                    >
                      Block #{tx.blockHeight}
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-500">Pending</span>
                  )}
                  {tx.timestamp && (
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(tx.timestamp))} ago
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
