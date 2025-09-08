import Link from 'next/link';
import { getProvider } from '@/lib/data';
import { formatDistanceToNow } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

// Disable prerendering so network calls are executed at request time
export const dynamic = 'force-dynamic';

export default async function BlockDetailPage({ params }: PageProps) {
  const provider = getProvider();
  
  // Fetch block details
  const block = await provider.getBlockByHashOrHeight(params.id);
  
  // Handle not found
  if (!block) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Block #{block.height}</h1>
        <Link 
          href="/blocks" 
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          ← Back to Blocks
        </Link>
      </div>
      
      <section className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Block Details</h2>
        </div>
        
        <div className="divide-y divide-gray-700">
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Height</div>
            <div className="col-span-9 text-white font-medium">#{block.height}</div>
          </div>
          
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Hash</div>
            <div className="col-span-9 text-white font-mono text-sm break-all">{block.hash}</div>
          </div>
          
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Timestamp</div>
            <div className="col-span-9 text-white">
              {new Date(block.timestamp).toLocaleString()} 
              <span className="text-gray-400 ml-2 text-sm">
                ({formatDistanceToNow(new Date(block.timestamp))} ago)
              </span>
            </div>
          </div>
          
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Transactions</div>
            <div className="col-span-9">
              <span className="text-white">{block.txCount}</span>
              {block.txCount > 0 && (
                <Link 
                  href={`/blocks/${block.height}/txs`}
                  className="ml-3 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View Transactions →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
