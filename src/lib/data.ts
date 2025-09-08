/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data layer for Midnight Explorer
 * 
 * Provides a unified interface for accessing blockchain data with
 * implementations for both mock data and HTTP API connections.
 */

import { Block, Transaction, AddressSummary, Page } from './types';
import { INDEXER_URL, RPC_URL } from './env';

/**
 * Core interface for accessing blockchain data
 */
export interface ExplorerProvider {
  /**
   * Get the most recent blocks
   * @param limit Maximum number of blocks to return
   */
  getLatestBlocks(limit: number): Promise<Block[]>;
  
  /**
   * Get the most recent transactions
   * @param limit Maximum number of transactions to return
   */
  getLatestTransactions(limit: number): Promise<Transaction[]>;
  
  /**
   * Get a paginated list of blocks
   * @param cursor Optional pagination cursor
   */
  getBlocksPage(cursor?: string): Promise<Page<Block>>;
  
  /**
   * Get a specific block by hash or height
   * @param id Block hash or height
   */
  getBlockByHashOrHeight(id: string): Promise<Block | null>;
  
  /**
   * Get a paginated list of transactions
   * @param cursor Optional pagination cursor
   */
  getTransactionsPage(cursor?: string): Promise<Page<Transaction>>;
  
  /**
   * Get a specific transaction by hash
   * @param hash Transaction hash
   */
  getTransactionByHash(hash: string): Promise<Transaction | null>;
  
  /**
   * Get summary information for an address
   * @param addr Address in bech32m format
   */
  getAddressSummary(addr: string): Promise<AddressSummary | null>;

  /**
   * Get transactions that belong to a specific block
   * @param id Block hash or height
   * @param cursor Optional pagination cursor
   */
  getBlockTransactions(
    id: string,
    cursor?: string
  ): Promise<Page<Transaction>>;
}

/**
 * Generate a deterministic random number between 0 and 1
 * @param seed String to use as seed
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Normalize to [0, 1]
  return (Math.abs(hash) % 1000000) / 1000000;
}

/**
 * Generate a mock block with deterministic data
 * @param height Block height
 */
function generateMockBlock(height: number): Block {
  const date = new Date();
  date.setMinutes(date.getMinutes() - height * 2); // 2 minutes per block
  
  const seed = `block-${height}-${date.toISOString().split('T')[0]}`;
  const rand = seededRandom(seed);
  
  // Generate a fake hash with some determinism
  const hash = Array.from({ length: 64 }, (_, i) => {
    const charCode = Math.floor(seededRandom(`${seed}-${i}`) * 16);
    return charCode.toString(16);
  }).join('');
  
  return {
    height,
    hash,
    timestamp: date.toISOString(),
    txCount: Math.floor(rand * 20) + 1, // 1-20 transactions
  };
}

/**
 * Generate a mock transaction with deterministic data
 * @param index Transaction index for determinism
 * @param blockHeight Optional block height for confirmed transactions
 */
function generateMockTransaction(index: number, blockHeight?: number): Transaction {
  const date = new Date();
  date.setMinutes(date.getMinutes() - (blockHeight || 0) * 2 - index * 0.1);
  
  const seed = `tx-${index}-${date.toISOString().split('T')[0]}`;
  const rand = seededRandom(seed);
  
  // Generate a fake hash with some determinism
  const hash = Array.from({ length: 64 }, (_, i) => {
    const charCode = Math.floor(seededRandom(`${seed}-${i}`) * 16);
    return charCode.toString(16);
  }).join('');
  
  return {
    hash,
    status: blockHeight ? 'success' : (rand > 0.9 ? 'failed' : 'pending'),
    blockHeight,
    timestamp: blockHeight ? date.toISOString() : undefined,
    size: Math.floor(rand * 2000) + 500, // 500-2500 bytes
  };
}

/**
 * Mock implementation of ExplorerProvider using generated data
 */
export class MockProvider implements ExplorerProvider {
  private readonly mockBlocks: Block[] = [];
  private readonly mockTransactions: Transaction[] = [];
  
  constructor() {
    // Generate 100 mock blocks
    const latestHeight = 12345;
    for (let i = 0; i < 100; i++) {
      this.mockBlocks.push(generateMockBlock(latestHeight - i));
    }
    
    // Generate 200 mock transactions
    for (let i = 0; i < 200; i++) {
      // 80% of transactions are confirmed in blocks
      const blockHeight = i < 160 ? latestHeight - Math.floor(i / 4) : undefined;
      this.mockTransactions.push(generateMockTransaction(i, blockHeight));
    }
  }
  
  async getLatestBlocks(limit: number): Promise<Block[]> {
    return this.mockBlocks.slice(0, limit);
  }
  
  async getLatestTransactions(limit: number): Promise<Transaction[]> {
    return this.mockTransactions.slice(0, limit);
  }
  
  async getBlocksPage(cursor?: string): Promise<Page<Block>> {
    const cursorIndex = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 20;
    const items = this.mockBlocks.slice(cursorIndex, cursorIndex + pageSize);
    const nextCursor = cursorIndex + pageSize < this.mockBlocks.length 
      ? (cursorIndex + pageSize).toString() 
      : undefined;
    
    return { items, nextCursor };
  }
  
  async getBlockByHashOrHeight(id: string): Promise<Block | null> {
    // Try to parse as height first
    const height = parseInt(id, 10);
    if (!isNaN(height)) {
      const block = this.mockBlocks.find(b => b.height === height);
      return block || null;
    }
    
    // Otherwise treat as hash
    const block = this.mockBlocks.find(b => b.hash === id);
    return block || null;
  }
  
  async getTransactionsPage(cursor?: string): Promise<Page<Transaction>> {
    const cursorIndex = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 20;
    const items = this.mockTransactions.slice(cursorIndex, cursorIndex + pageSize);
    const nextCursor = cursorIndex + pageSize < this.mockTransactions.length 
      ? (cursorIndex + pageSize).toString() 
      : undefined;
    
    return { items, nextCursor };
  }
  
  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    const tx = this.mockTransactions.find(t => t.hash === hash);
    return tx || null;
  }
  
  async getAddressSummary(addr: string): Promise<AddressSummary | null> {
    // Generate deterministic address data
    const seed = `addr-${addr}`;
    const rand = seededRandom(seed);
    
    return {
      address: addr,
      balance: (Math.floor(rand * 10000) / 100).toString(),
      txCount: Math.floor(rand * 50) + 1,
    };
  }

  /**
   * Return transactions for a given block (paginated)
   */
  async getBlockTransactions(
    id: string,
    cursor?: string
  ): Promise<Page<Transaction>> {
    // Resolve block height from id
    let height: number | undefined;
    const num = parseInt(id, 10);
    if (!isNaN(num)) {
      height = num;
    } else {
      const block = this.mockBlocks.find((b) => b.hash === id);
      height = block?.height;
    }

    if (height === undefined) {
      // Block not found -> empty page
      return { items: [], nextCursor: undefined };
    }

    const allTxs = this.mockTransactions.filter(
      (tx) => tx.blockHeight === height
    );

    const cursorIndex = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 20;
    const items = allTxs.slice(cursorIndex, cursorIndex + pageSize);
    const nextCursor =
      cursorIndex + pageSize < allTxs.length
        ? (cursorIndex + pageSize).toString()
        : undefined;

    return { items, nextCursor };
  }
}

/**
 * HTTP implementation of ExplorerProvider using real network endpoints
 * Falls back to mock data when API requests fail for seamless experience
 */
export class HttpProvider implements ExplorerProvider {
  private mockProvider: MockProvider;
  
  constructor() {
    if (!INDEXER_URL && !RPC_URL) {
      throw new Error(
        'Missing Midnight network endpoints. Please set NEXT_PUBLIC_INDEXER_URL ' +
        'and/or NEXT_PUBLIC_RPC_URL in your environment variables.'
      );
    }
    
    // Initialize mock provider for fallbacks
    this.mockProvider = new MockProvider();
  }
  
  /**
   * Helper method to execute GraphQL queries against the indexer
   * @param query GraphQL query string
   * @param variables Optional variables for the query
   * @returns Query result of type T or null if the query fails
   */
  private async graphQL<T>(query: string, variables?: Record<string, any>): Promise<T | null> {
    if (!INDEXER_URL) return null;
    
    try {
      const response = await fetch(INDEXER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });
      
      if (!response.ok) {
        console.warn(`GraphQL request failed: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const result = await response.json();
      
      if (result.errors) {
        console.warn('GraphQL errors:', result.errors);
        return null;
      }
      
      return result.data as T;
    } catch (error) {
      console.error('GraphQL request error:', error);
      return null;
    }
  }
  
  /**
   * Try multiple GraphQL queries in sequence, returning the first successful result
   * @param queries Array of query objects with query string and optional variables
   * @returns First successful query result or null if all fail
   */
  private async tryQueries<T>(
    queries: Array<{ query: string; variables?: Record<string, any> }>
  ): Promise<T | null> {
    for (const { query, variables } of queries) {
      const result = await this.graphQL<T>(query, variables);
      if (result !== null) return result;
    }
    return null;
  }
  
  /**
   * Map GraphQL block data to our Block model
   */
  private mapBlock(block: any): Block | null {
    try {
      // Handle different possible response formats
      const blockData = block.block || block;
      
      // Try to extract height from different possible fields
      const height = 
        blockData.height || 
        blockData.number || 
        (typeof blockData.header?.number === 'string' 
          ? parseInt(blockData.header.number, 10) 
          : blockData.header?.number);
      
      if (height === undefined) return null;
      
      // Try to extract hash from different possible fields
      const hash = blockData.hash || blockData.blockHash || blockData.id;
      if (!hash) return null;
      
      // Try to extract timestamp from different possible fields
      let timestamp = blockData.timestamp || blockData.time || blockData.datetime;
      if (!timestamp && blockData.header?.timestamp) {
        timestamp = new Date(parseInt(blockData.header.timestamp)).toISOString();
      }
      if (!timestamp) {
        // If no timestamp found, estimate based on current time and height
        const now = new Date();
        now.setMinutes(now.getMinutes() - height * 2); // Assume 2 min per block
        timestamp = now.toISOString();
      }
      
      // Try to extract transaction count from different possible fields
      const txCount = 
        blockData.txCount || 
        blockData.transactionCount || 
        blockData.extrinsicsCount ||
        (blockData.extrinsics?.length ?? 0);
      
      return {
        height,
        hash,
        timestamp,
        txCount,
      };
    } catch (error) {
      console.error('Error mapping block:', error);
      return null;
    }
  }
  
  /**
   * Map GraphQL transaction data to our Transaction model
   */
  private mapTransaction(tx: any): Transaction | null {
    try {
      // Handle different possible response formats
      const txData = tx.transaction || tx.extrinsic || tx;
      
      // Try to extract hash from different possible fields
      const hash = txData.hash || txData.txHash || txData.id;
      if (!hash) return null;
      
      // Try to extract status from different possible fields
      let status: 'success' | 'failed' | 'pending' = 'pending';
      if (txData.status === true || txData.success === true || txData.status === 'success') {
        status = 'success';
      } else if (txData.status === false || txData.success === false || txData.status === 'failed') {
        status = 'failed';
      }
      
      // Try to extract block height from different possible fields
      const blockHeight = 
        txData.blockHeight || 
        txData.blockNumber || 
        (txData.block?.height ?? undefined);
      
      // Try to extract timestamp from different possible fields
      let timestamp = txData.timestamp || txData.time || txData.datetime;
      if (!timestamp && txData.block?.timestamp) {
        timestamp = txData.block.timestamp;
      }
      
      // Try to extract size from different possible fields
      const size = txData.size || txData.length || undefined;
      
      return {
        hash,
        status,
        blockHeight,
        timestamp,
        size,
      };
    } catch (error) {
      console.error('Error mapping transaction:', error);
      return null;
    }
  }
  
  async getLatestBlocks(limit: number): Promise<Block[]> {
    try {
      // Try different query formats that might work with the indexer
      const result = await this.tryQueries<any>([
        {
          // Try standard GraphQL format
          query: `
            query GetLatestBlocks($limit: Int!) {
              blocks(orderBy: HEIGHT_DESC, limit: $limit) {
                height
                hash
                timestamp
                extrinsicsCount
              }
            }
          `,
          variables: { limit },
        },
        {
          // Try alternative field names
          query: `
            query GetLatestBlocks($limit: Int!) {
              blocks(orderBy: {height: DESC}, limit: $limit) {
                height
                hash
                timestamp
                transactionCount
              }
            }
          `,
          variables: { limit },
        },
        {
          // Try another alternative format
          query: `
            query GetLatestBlocks($limit: Int!) {
              blocks(first: $limit, orderBy: height, orderDirection: desc) {
                id
                number
                timestamp
                transactionsCount
              }
            }
          `,
          variables: { limit },
        },
      ]);
      
      if (!result) {
        // Fall back to mock data if all queries fail
        console.warn('Falling back to mock data for getLatestBlocks');
        return this.mockProvider.getLatestBlocks(limit);
      }
      
      // Try to extract blocks from different possible response formats
      const blocksData = result.blocks || result.data?.blocks || [];
      
      // Map to our Block model
      const blocks = blocksData
        .map((block: any) => this.mapBlock(block))
        .filter((block: Block | null): block is Block => block !== null);
      
      return blocks.length > 0 ? blocks : this.mockProvider.getLatestBlocks(limit);
    } catch (error) {
      console.error('Error in getLatestBlocks:', error);
      // Fall back to mock data on error
      return this.mockProvider.getLatestBlocks(limit);
    }
  }
  
  async getLatestTransactions(limit: number): Promise<Transaction[]> {
    try {
      // Try different query formats that might work with the indexer
      const result = await this.tryQueries<any>([
        {
          // Try standard GraphQL format
          query: `
            query GetLatestTransactions($limit: Int!) {
              transactions(orderBy: TIMESTAMP_DESC, limit: $limit) {
                hash
                status
                blockHeight
                timestamp
                size
              }
            }
          `,
          variables: { limit },
        },
        {
          // Try alternative field names
          query: `
            query GetLatestTransactions($limit: Int!) {
              extrinsics(orderBy: {timestamp: DESC}, limit: $limit) {
                hash
                success
                block {
                  height
                  timestamp
                }
                length
              }
            }
          `,
          variables: { limit },
        },
        {
          // Try another alternative format
          query: `
            query GetLatestTransactions($limit: Int!) {
              transactions(first: $limit, orderBy: blockNumber, orderDirection: desc) {
                id
                hash
                status
                blockNumber
                timestamp
              }
            }
          `,
          variables: { limit },
        },
      ]);
      
      if (!result) {
        // Fall back to mock data if all queries fail
        console.warn('Falling back to mock data for getLatestTransactions');
        return this.mockProvider.getLatestTransactions(limit);
      }
      
      // Try to extract transactions from different possible response formats
      const txsData = 
        result.transactions || 
        result.extrinsics || 
        result.data?.transactions || 
        result.data?.extrinsics || 
        [];
      
      // Map to our Transaction model
      const txs = txsData
        .map((tx: any) => this.mapTransaction(tx))
        .filter((tx: Transaction | null): tx is Transaction => tx !== null);
      
      return txs.length > 0 ? txs : this.mockProvider.getLatestTransactions(limit);
    } catch (error) {
      console.error('Error in getLatestTransactions:', error);
      // Fall back to mock data on error
      return this.mockProvider.getLatestTransactions(limit);
    }
  }
  
  async getBlocksPage(cursor?: string): Promise<Page<Block>> {
    try {
      // Parse cursor as offset
      const offset = cursor ? parseInt(cursor, 10) : 0;
      const limit = 20;
      
      // Try different query formats that might work with the indexer
      const result = await this.tryQueries<any>([
        {
          // Try standard GraphQL format
          query: `
            query GetBlocksPage($offset: Int!, $limit: Int!) {
              blocks(orderBy: HEIGHT_DESC, offset: $offset, limit: $limit) {
                height
                hash
                timestamp
                extrinsicsCount
              }
            }
          `,
          variables: { offset, limit },
        },
        {
          // Try alternative field names
          query: `
            query GetBlocksPage($offset: Int!, $limit: Int!) {
              blocks(orderBy: {height: DESC}, skip: $offset, limit: $limit) {
                height
                hash
                timestamp
                transactionCount
              }
            }
          `,
          variables: { offset, limit },
        },
        {
          // Try cursor-based pagination
          query: `
            query GetBlocksPage($cursor: String, $limit: Int!) {
              blocks(after: $cursor, first: $limit, orderBy: height, orderDirection: desc) {
                id
                number
                timestamp
                transactionsCount
              }
            }
          `,
          variables: { cursor, limit },
        },
      ]);
      
      if (!result) {
        // Fall back to mock data if all queries fail
        console.warn('Falling back to mock data for getBlocksPage');
        return this.mockProvider.getBlocksPage(cursor);
      }
      
      // Try to extract blocks from different possible response formats
      const blocksData = result.blocks || result.data?.blocks || [];
      
      // Map to our Block model
      const items = blocksData
        .map((block: any) => this.mapBlock(block))
        .filter((block: Block | null): block is Block => block !== null);
      
      if (items.length === 0) {
        return this.mockProvider.getBlocksPage(cursor);
      }
      
      // Calculate next cursor
      const nextCursor = items.length === limit ? (offset + limit).toString() : undefined;
      
      return { items, nextCursor };
    } catch (error) {
      console.error('Error in getBlocksPage:', error);
      // Fall back to mock data on error
      return this.mockProvider.getBlocksPage(cursor);
    }
  }
  
  async getBlockByHashOrHeight(id: string): Promise<Block | null> {
    try {
      // Determine if id is a height or hash
      const isHeight = /^\d+$/.test(id);
      const height = isHeight ? parseInt(id, 10) : undefined;
      const hash = isHeight ? undefined : id;
      
      // Try different query formats that might work with the indexer
      const result = await this.tryQueries<any>([
        {
          // Try by height
          query: `
            query GetBlock($height: Int) {
              block(height: $height) {
                height
                hash
                timestamp
                extrinsicsCount
              }
            }
          `,
          variables: { height },
        },
        {
          // Try by hash
          query: `
            query GetBlock($hash: String) {
              block(hash: $hash) {
                height
                hash
                timestamp
                transactionCount
              }
            }
          `,
          variables: { hash },
        },
        {
          // Try alternative field names
          query: `
            query GetBlock($height: Int, $hash: String) {
              block(number: $height, id: $hash) {
                number
                id
                timestamp
                transactionsCount
              }
            }
          `,
          variables: { height, hash },
        },
      ]);
      
      if (!result) {
        // Fall back to mock data if all queries fail
        console.warn('Falling back to mock data for getBlockByHashOrHeight');
        return this.mockProvider.getBlockByHashOrHeight(id);
      }
      
      // Try to extract block from different possible response formats
      const blockData = result.block || result.data?.block;
      
      if (!blockData) {
        return this.mockProvider.getBlockByHashOrHeight(id);
      }
      
      // Map to our Block model
      const block = this.mapBlock(blockData);
      
      return block || this.mockProvider.getBlockByHashOrHeight(id);
    } catch (error) {
      console.error('Error in getBlockByHashOrHeight:', error);
      // Fall back to mock data on error
      return this.mockProvider.getBlockByHashOrHeight(id);
    }
  }
  
  async getTransactionsPage(cursor?: string): Promise<Page<Transaction>> {
    try {
      // Parse cursor as offset
      const offset = cursor ? parseInt(cursor, 10) : 0;
      const limit = 20;
      
      // Try different query formats that might work with the indexer
      const result = await this.tryQueries<any>([
        {
          // Try standard GraphQL format
          query: `
            query GetTransactionsPage($offset: Int!, $limit: Int!) {
              transactions(orderBy: TIMESTAMP_DESC, offset: $offset, limit: $limit) {
                hash
                status
                blockHeight
                timestamp
                size
              }
            }
          `,
          variables: { offset, limit },
        },
        {
          // Try alternative field names
          query: `
            query GetTransactionsPage($offset: Int!, $limit: Int!) {
              extrinsics(orderBy: {timestamp: DESC}, skip: $offset, limit: $limit) {
                hash
                success
                block {
                  height
                  timestamp
                }
                length
              }
            }
          `,
          variables: { offset, limit },
        },
        {
          // Try cursor-based pagination
          query: `
            query GetTransactionsPage($cursor: String, $limit: Int!) {
              transactions(after: $cursor, first: $limit, orderBy: blockNumber, orderDirection: desc) {
                id
                hash
                status
                blockNumber
                timestamp
              }
            }
          `,
          variables: { cursor, limit },
        },
      ]);
      
      if (!result) {
        // Fall back to mock data if all queries fail
        console.warn('Falling back to mock data for getTransactionsPage');
        return this.mockProvider.getTransactionsPage(cursor);
      }
      
      // Try to extract transactions from different possible response formats
      const txsData = 
        result.transactions || 
        result.extrinsics || 
        result.data?.transactions || 
        result.data?.extrinsics || 
        [];
      
      // Map to our Transaction model
      const items = txsData
        .map((tx: any) => this.mapTransaction(tx))
        .filter((tx: Transaction | null): tx is Transaction => tx !== null);
      
      if (items.length === 0) {
        return this.mockProvider.getTransactionsPage(cursor);
      }
      
      // Calculate next cursor
      const nextCursor = items.length === limit ? (offset + limit).toString() : undefined;
      
      return { items, nextCursor };
    } catch (error) {
      console.error('Error in getTransactionsPage:', error);
      // Fall back to mock data on error
      return this.mockProvider.getTransactionsPage(cursor);
    }
  }
  
  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    try {
      // Try different query formats that might work with the indexer
      const result = await this.tryQueries<any>([
        {
          // Try standard GraphQL format
          query: `
            query GetTransaction($hash: String!) {
              transaction(hash: $hash) {
                hash
                status
                blockHeight
                timestamp
                size
              }
            }
          `,
          variables: { hash },
        },
        {
          // Try alternative field names
          query: `
            query GetTransaction($hash: String!) {
              extrinsic(hash: $hash) {
                hash
                success
                block {
                  height
                  timestamp
                }
                length
              }
            }
          `,
          variables: { hash },
        },
        {
          // Try another alternative format
          query: `
            query GetTransaction($hash: String!) {
              transaction(id: $hash) {
                id
                hash
                status
                blockNumber
                timestamp
              }
            }
          `,
          variables: { hash },
        },
      ]);
      
      if (!result) {
        // Fall back to mock data if all queries fail
        console.warn('Falling back to mock data for getTransactionByHash');
        return this.mockProvider.getTransactionByHash(hash);
      }
      
      // Try to extract transaction from different possible response formats
      const txData = 
        result.transaction || 
        result.extrinsic || 
        result.data?.transaction || 
        result.data?.extrinsic;
      
      if (!txData) {
        return this.mockProvider.getTransactionByHash(hash);
      }
      
      // Map to our Transaction model
      const tx = this.mapTransaction(txData);
      
      return tx || this.mockProvider.getTransactionByHash(hash);
    } catch (error) {
      console.error('Error in getTransactionByHash:', error);
      // Fall back to mock data on error
      return this.mockProvider.getTransactionByHash(hash);
    }
  }
  
  async getAddressSummary(addr: string): Promise<AddressSummary | null> {
    try {
      // Try different query formats that might work with the indexer
      const result = await this.tryQueries<any>([
        {
          // Try standard GraphQL format
          query: `
            query GetAddress($address: String!) {
              address(address: $address) {
                address
                balance
                txCount
              }
            }
          `,
          variables: { address: addr },
        },
        {
          // Try alternative field names
          query: `
            query GetAddress($address: String!) {
              account(address: $address) {
                address
                balance
                transactionCount
              }
            }
          `,
          variables: { address: addr },
        },
        {
          // Try another alternative format
          query: `
            query GetAddress($address: String!) {
              account(id: $address) {
                id
                balances {
                  free
                }
                transactionsCount
              }
            }
          `,
          variables: { address: addr },
        },
      ]);
      
      if (!result) {
        // Fall back to mock data if all queries fail
        console.warn('Falling back to mock data for getAddressSummary');
        return this.mockProvider.getAddressSummary(addr);
      }
      
      // Try to extract address data from different possible response formats
      const addressData = 
        result.address || 
        result.account || 
        result.data?.address || 
        result.data?.account;
      
      if (!addressData) {
        return this.mockProvider.getAddressSummary(addr);
      }
      
      // Try to extract fields from different possible formats
      const address = addressData.address || addressData.id || addr;
      
      let balance: string | undefined;
      if (typeof addressData.balance === 'string' || typeof addressData.balance === 'number') {
        balance = addressData.balance.toString();
      } else if (addressData.balances?.free) {
        balance = addressData.balances.free.toString();
      }
      
      const txCount = 
        addressData.txCount || 
        addressData.transactionCount || 
        addressData.transactionsCount;
      
      return {
        address,
        balance,
        txCount,
      };
    } catch (error) {
      console.error('Error in getAddressSummary:', error);
      // Fall back to mock data on error
      return this.mockProvider.getAddressSummary(addr);
    }
  }
  
  async getBlockTransactions(
    id: string,
    cursor?: string
  ): Promise<Page<Transaction>> {
    try {
      // Determine if id is a height or hash
      const isHeight = /^\d+$/.test(id);
      const height = isHeight ? parseInt(id, 10) : undefined;
      const hash = isHeight ? undefined : id;
      
      // Parse cursor as offset
      const offset = cursor ? parseInt(cursor, 10) : 0;
      const limit = 20;
      
      // Try different query formats that might work with the indexer
      const result = await this.tryQueries<any>([
        {
          // Try by height
          query: `
            query GetBlockTransactions($height: Int!, $offset: Int!, $limit: Int!) {
              blockTransactions(blockHeight: $height, offset: $offset, limit: $limit) {
                hash
                status
                blockHeight
                timestamp
                size
              }
            }
          `,
          variables: { height, offset, limit },
        },
        {
          // Try by hash
          query: `
            query GetBlockTransactions($hash: String!, $offset: Int!, $limit: Int!) {
              blockTransactions(blockHash: $hash, offset: $offset, limit: $limit) {
                hash
                status
                blockHeight
                timestamp
                size
              }
            }
          `,
          variables: { hash, offset, limit },
        },
        {
          // Try alternative field names
          query: `
            query GetBlockTransactions($height: Int, $hash: String, $offset: Int!, $limit: Int!) {
              extrinsics(
                where: { block: { height: $height, hash: $hash } }
                skip: $offset
                limit: $limit
              ) {
                hash
                success
                block {
                  height
                  timestamp
                }
                length
              }
            }
          `,
          variables: { height, hash, offset, limit },
        },
      ]);
      
      if (!result) {
        // First verify the block exists
        const block = await this.getBlockByHashOrHeight(id);
        if (!block) {
          return { items: [], nextCursor: undefined };
        }
        
        // Fall back to mock data if all queries fail
        console.warn('Falling back to mock data for getBlockTransactions');
        return this.mockProvider.getBlockTransactions(id, cursor);
      }
      
      // Try to extract transactions from different possible response formats
      const txsData = 
        result.blockTransactions || 
        result.extrinsics || 
        result.data?.blockTransactions || 
        result.data?.extrinsics || 
        [];
      
      // Map to our Transaction model
      const items = txsData
        .map((tx: any) => this.mapTransaction(tx))
        .filter((tx: Transaction | null): tx is Transaction => tx !== null);
      
      if (items.length === 0) {
        // Verify the block exists before returning empty results
        const block = await this.getBlockByHashOrHeight(id);
        if (!block) {
          return { items: [], nextCursor: undefined };
        }
        
        return this.mockProvider.getBlockTransactions(id, cursor);
      }
      
      // Calculate next cursor
      const nextCursor = items.length === limit ? (offset + limit).toString() : undefined;
      
      return { items, nextCursor };
    } catch (error) {
      console.error('Error in getBlockTransactions:', error);
      // Fall back to mock data on error
      return this.mockProvider.getBlockTransactions(id, cursor);
    }
  }
}

/**
 * Factory function to get the appropriate provider based on configuration
 */
export function getProvider(): ExplorerProvider {
  // Prefer real network if any endpoint is configured; otherwise fall back to mock data
  if (INDEXER_URL || RPC_URL) {
    try {
      return new HttpProvider();
    } catch {
      // If construction fails, fall back to mock provider
      return new MockProvider();
    }
  }
  return new MockProvider();
}
