import Link from 'next/link';
import { getProvider } from '@/lib/data';
import { formatDistanceToNow } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    hash: string;
  };
}

// Disable prerendering so network calls are done at request time
export const dynamic = 'force-dynamic';

export default async function TransactionDetailPage({ params }: PageProps) {
  const provider = getProvider();
  
  // Fetch transaction details
  const tx = await provider.getTransactionByHash(params.hash);
  
  // Handle not found
  if (!tx) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Transaction Details</h1>
        <Link 
          href="/txs" 
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          ← Back to Transactions
        </Link>
      </div>
      
      <section className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Transaction Information</h2>
        </div>
        
        <div className="divide-y divide-gray-700">
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Hash</div>
            <div className="col-span-9 text-white font-mono text-sm break-all">{tx.hash}</div>
          </div>
          
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Status</div>
            <div className="col-span-9">
              <span className={`text-xs px-2 py-1 rounded ${
                tx.status === 'success' 
                  ? 'bg-green-900/30 text-green-300' 
                  : tx.status === 'failed' 
                    ? 'bg-red-900/30 text-red-300'
                    : 'bg-yellow-900/30 text-yellow-300'
              }`}>
                {tx.status}
              </span>
            </div>
          </div>
          
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Block</div>
            <div className="col-span-9 text-white">
              {tx.blockHeight ? (
                <Link 
                  href={`/blocks/${tx.blockHeight}`}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  #{tx.blockHeight}
                </Link>
              ) : (
                <span className="text-gray-500">Pending</span>
              )}
            </div>
          </div>
          
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Timestamp</div>
            <div className="col-span-9 text-white">
              {tx.timestamp ? (
                <>
                  {new Date(tx.timestamp).toLocaleString()} 
                  <span className="text-gray-400 ml-2 text-sm">
                    ({formatDistanceToNow(new Date(tx.timestamp))} ago)
                  </span>
                </>
              ) : (
                <span className="text-gray-500">Pending</span>
              )}
            </div>
          </div>
          
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Size</div>
            <div className="col-span-9 text-white">
              {tx.size ? `${tx.size} bytes` : 'Unknown'}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
