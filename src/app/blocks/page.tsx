import Link from 'next/link';
import { getProvider } from '@/lib/data';
import { formatDistanceToNow } from '@/lib/utils';

// Disable prerendering so network calls are done at request time
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: {
    cursor?: string;
  };
}

export default async function BlocksPage({ searchParams }: PageProps) {
  const provider = getProvider();
  const cursor = searchParams?.cursor;
  
  // Fetch blocks with pagination
  const { items: blocks, nextCursor } = await provider.getBlocksPage(cursor);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Blocks</h1>
        <div className="text-sm text-gray-400">
          {cursor ? `Page after ${cursor}` : 'Latest blocks'}
        </div>
      </div>
      
      <section className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700 grid grid-cols-12 text-sm font-medium text-gray-400">
          <div className="col-span-2">Height</div>
          <div className="col-span-6">Hash</div>
          <div className="col-span-2">Age</div>
          <div className="col-span-2 text-right">Txs</div>
        </div>
        
        <div className="divide-y divide-gray-700">
          {blocks.map(block => (
            <div key={block.hash} className="px-4 py-3 hover:bg-gray-700/30 transition-colors grid grid-cols-12 items-center">
              <div className="col-span-2">
                <Link 
                  href={`/blocks/${block.height}`}
                  className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  #{block.height}
                </Link>
              </div>
              <div className="col-span-6">
                <div className="text-gray-300 font-mono text-sm truncate">
                  {block.hash}
                </div>
              </div>
              <div className="col-span-2 text-gray-400 text-sm">
                {formatDistanceToNow(new Date(block.timestamp))} ago
              </div>
              <div className="col-span-2 text-right">
                <div className="inline-block text-xs px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded">
                  {block.txCount} txs
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="flex justify-end mt-4">
        {nextCursor && (
          <Link
            href={`/blocks?cursor=${nextCursor}`}
            className="px-4 py-2 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 rounded-md transition-colors"
          >
            Next Page →
          </Link>
        )}
      </div>
    </div>
  );
}
