import Link from 'next/link';
import { getProvider } from '@/lib/data';
import { notFound } from 'next/navigation';

// Disable prerendering so network calls are executed at request time
export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    address: string;
  };
}

export default async function AddressDetailPage({ params }: PageProps) {
  const provider = getProvider();
  
  // Fetch address summary
  const addressSummary = await provider.getAddressSummary(params.address);
  
  // Handle not found
  if (!addressSummary) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Address Details</h1>
        <Link 
          href="/" 
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
      
      <section className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Address Information</h2>
        </div>
        
        <div className="divide-y divide-gray-700">
          <div className="px-4 py-3 grid grid-cols-12">
            <div className="col-span-3 text-gray-400">Address</div>
            <div className="col-span-9 text-white font-mono text-sm break-all">
              {addressSummary.address}
            </div>
          </div>
          
          {addressSummary.balance !== undefined && (
            <div className="px-4 py-3 grid grid-cols-12">
              <div className="col-span-3 text-gray-400">Balance</div>
              <div className="col-span-9 text-white">
                {addressSummary.balance} tDUST
              </div>
            </div>
          )}
          
          {addressSummary.txCount !== undefined && (
            <div className="px-4 py-3 grid grid-cols-12">
              <div className="col-span-3 text-gray-400">Transactions</div>
              <div className="col-span-9 text-white">
                {addressSummary.txCount}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
