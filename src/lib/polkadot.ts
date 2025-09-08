/**
 * Polkadot API singleton wrapper for Midnight Explorer
 * 
 * Provides a cached connection to the Midnight blockchain via WebSocket
 * and helper functions for common blockchain queries.
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { RPC_URL } from './env';

// Singleton instance of the Polkadot API
let apiInstance: ApiPromise | null = null;
let disconnectHandler: (() => void) | null = null;

/**
 * Convert HTTP/HTTPS URL to WebSocket URL (WS/WSS)
 */
function httpToWs(url: string): string {
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://');
  }
  if (url.startsWith('http://')) {
    return url.replace('http://', 'ws://');
  }
  return url;
}

/**
 * Get the WebSocket URL for the Midnight RPC
 */
function getWsUrl(): string {
  if (!RPC_URL) {
    return 'wss://rpc.testnet-02.midnight.network';
  }
  return httpToWs(RPC_URL);
}

/**
 * Get a singleton instance of the Polkadot API
 * Will create a new instance if one doesn't exist or if the connection is disconnected
 */
export async function getApi(): Promise<ApiPromise> {
  // If we have an existing instance and it's connected, return it
  if (apiInstance && apiInstance.isConnected) {
    return apiInstance;
  }

  // Clean up any existing instance
  if (apiInstance) {
    try {
      if (disconnectHandler) {
        apiInstance.off('disconnected', disconnectHandler);
      }
      await apiInstance.disconnect();
    } catch (error) {
      console.warn('Error disconnecting from previous API instance:', error);
    }
    apiInstance = null;
  }

  // Create a new instance
  const wsUrl = getWsUrl();
  console.log(`Connecting to Midnight RPC at ${wsUrl}`);
  
  const provider = new WsProvider(wsUrl);
  apiInstance = await ApiPromise.create({ provider });
  
  // Set up disconnect handler to clean up the instance when disconnected
  disconnectHandler = () => {
    console.warn('Disconnected from Midnight RPC');
    apiInstance = null;
  };
  
  apiInstance.on('disconnected', disconnectHandler);
  
  return apiInstance;
}

/**
 * Get information about the current chain tip (latest block)
 */
export async function getTipInfo(): Promise<{ hash: string; height: number }> {
  const api = await getApi();
  
  // Get the latest finalized block hash
  const finalizedHash = await api.rpc.chain.getFinalizedHead();
  
  // Get the header for this hash to extract the block number
  const header = await api.rpc.chain.getHeader(finalizedHash);
  
  return {
    hash: finalizedHash.toString(),
    height: header.number.toNumber(),
  };
}
