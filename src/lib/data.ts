/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data layer for Midnight Explorer
 * 
 * Provides a unified interface for accessing blockchain data with
 * implementations for real-time Polkadot API connections.
 */

import { Block, Transaction, AddressSummary, Page } from './types';
import { RPC_URL } from './env';
import { getApi, getTipInfo } from './polkadot';

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
 * HTTP implementation of ExplorerProvider using only the Polkadot API
 * (no GraphQL, no mock fall-backs)
 */
export class HttpProvider implements ExplorerProvider {
  constructor() {
    if (!RPC_URL) {
      throw new Error('Missing Midnight RPC endpoint. Please set NEXT_PUBLIC_RPC_URL');
    }
  }

  private async getBlockByHeight(height: number): Promise<Block> {
    const api = await getApi();
    const hash = await api.rpc.chain.getBlockHash(height);
    const signedBlock = await api.rpc.chain.getBlock(hash);
    const extrinsics = signedBlock.block.extrinsics;

    let timestamp = new Date().toISOString();
    try {
      const tsExtrinsic = extrinsics.find((ext) => ext.method.section === 'timestamp');
      if (tsExtrinsic) {
        const ms = Number(tsExtrinsic.method.args[0].toString());
        timestamp = new Date(ms).toISOString();
      }
    } catch {}

    return {
      height,
      hash: hash.toHex(),
      timestamp,
      txCount: extrinsics.length,
    };
  }

  private async mapExtrinsicsForBlock(blockHeight: number, blockHashHex: string): Promise<Transaction[]> {
    const api = await getApi();
    const signedBlock = await api.rpc.chain.getBlock(blockHashHex);
    const extrinsics = signedBlock.block.extrinsics;

    let blockTimestamp: string | undefined;
    try {
      const tsExtrinsic = extrinsics.find((ext) => ext.method.section === 'timestamp');
      if (tsExtrinsic) {
        const ms = Number(tsExtrinsic.method.args[0].toString());
        blockTimestamp = new Date(ms).toISOString();
      }
    } catch {}

    let events: any[] = [];
    try {
      const e = await api.query.system.events.at(blockHashHex);
      // Vec<EventRecord> is returned as a Codec. Cast via unknown first to silence TS incompatibility.
      events = (e as unknown) as any[];
    } catch {}

    const items: Transaction[] = [];
    extrinsics.forEach((ext, idx) => {
      const hash = ext.hash.toHex();
      let status: 'success' | 'failed' | 'pending' = 'pending';
      try {
        const related = events.filter(
          (rec: any) => rec.phase?.isApplyExtrinsic && rec.phase.asApplyExtrinsic.toNumber() === idx
        );
        if (related.some((r: any) => r.event.section === 'system' && r.event.method === 'ExtrinsicSuccess')) {
          status = 'success';
        } else if (related.some((r: any) => r.event.section === 'system' && r.event.method === 'ExtrinsicFailed')) {
          status = 'failed';
        }
      } catch {}

      items.push({
        hash,
        status,
        blockHeight,
        timestamp: blockTimestamp,
        size: (ext.encodedLength as number) ?? undefined,
      });
    });

    return items;
  }

  async getLatestBlocks(limit: number): Promise<Block[]> {
    const { height: tip } = await getTipInfo();
    const heights: number[] = [];
    for (let h = tip; h > tip - limit && h >= 0; h--) heights.push(h);
    return Promise.all(heights.map((h) => this.getBlockByHeight(h)));
  }

  async getBlocksPage(cursor?: string): Promise<Page<Block>> {
    const offset = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 20;
    const { height: tip } = await getTipInfo();
    const heights: number[] = [];
    for (let i = 0; i < pageSize; i++) {
      const h = tip - offset - i;
      if (h < 0) break;
      heights.push(h);
    }
    const items = await Promise.all(heights.map((h) => this.getBlockByHeight(h)));
    const nextCursor = heights.length === pageSize ? (offset + pageSize).toString() : undefined;
    return { items, nextCursor };
  }

  async getBlockByHashOrHeight(id: string): Promise<Block | null> {
    const api = await getApi();
    let height: number | undefined;
    let hashHex: string | undefined;

    if (/^\d+$/.test(id)) {
      height = parseInt(id, 10);
      const hash = await api.rpc.chain.getBlockHash(height);
      hashHex = hash.toHex();
    } else {
      hashHex = id;
      const signedBlock = await api.rpc.chain.getBlock(hashHex);
      height = signedBlock.block.header.number.toNumber();
    }

    if (height === undefined || !hashHex) return null;
    return this.getBlockByHeight(height);
  }

  async getLatestTransactions(limit: number): Promise<Transaction[]> {
    const { height: tip } = await getTipInfo();
    const out: Transaction[] = [];
    const api = await getApi();

    let h = tip;
    let scanned = 0;
    const maxScanBlocks = 200;

    while (out.length < limit && h >= 0 && scanned < maxScanBlocks) {
      const hash = await api.rpc.chain.getBlockHash(h);
      const items = await this.mapExtrinsicsForBlock(h, hash.toHex());
      out.push(...items.reverse()); // newest first
      h -= 1;
      scanned += 1;
    }

    return out.slice(0, limit);
  }

  async getTransactionsPage(cursor?: string): Promise<Page<Transaction>> {
    const offset = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 20;
    const { height: tip } = await getTipInfo();
    const api = await getApi();

    const collected: Transaction[] = [];
    let h = tip;
    let scanned = 0;
    const maxScanBlocks = 200;

    while (collected.length < offset + pageSize && h >= 0 && scanned < maxScanBlocks) {
      const hash = await api.rpc.chain.getBlockHash(h);
      const items = await this.mapExtrinsicsForBlock(h, hash.toHex());
      collected.push(...items.reverse());
      h -= 1;
      scanned += 1;
    }

    const items = collected.slice(offset, offset + pageSize);
    const nextCursor = collected.length > offset + pageSize ? (offset + pageSize).toString() : undefined;
    return { items, nextCursor };
  }

  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    const { height: tip } = await getTipInfo();
    const api = await getApi();

    let h = tip;
    let scanned = 0;
    const maxScanBlocks = 500;

    while (h >= 0 && scanned < maxScanBlocks) {
      const bHash = await api.rpc.chain.getBlockHash(h);
      const items = await this.mapExtrinsicsForBlock(h, bHash.toHex());
      const found = items.find((tx) => tx.hash.toLowerCase() === hash.toLowerCase());
      if (found) return found;
      h -= 1;
      scanned += 1;
    }

    return null;
  }

  async getAddressSummary(_addr: string): Promise<AddressSummary | null> {
    // Not supported without an indexer
    return null;
  }

  async getBlockTransactions(id: string, cursor?: string): Promise<Page<Transaction>> {
    const api = await getApi();

    let height: number;
    let hashHex: string;
    if (/^\d+$/.test(id)) {
      height = parseInt(id, 10);
      const hash = await api.rpc.chain.getBlockHash(height);
      hashHex = hash.toHex();
    } else {
      hashHex = id;
      const signedBlock = await api.rpc.chain.getBlock(hashHex);
      height = signedBlock.block.header.number.toNumber();
    }

    const all = await this.mapExtrinsicsForBlock(height, hashHex);
    const offset = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 20;
    const items = all.slice(offset, offset + pageSize);
    const nextCursor = all.length > offset + pageSize ? (offset + pageSize).toString() : undefined;
    return { items, nextCursor };
  }
}

/**
 * Factory function to get the appropriate provider based on configuration
 */
export function getProvider(): ExplorerProvider {
  // Always use real network; developer must set RPC_URL
  return new HttpProvider();
}
