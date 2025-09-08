/**
 * Type definitions for Midnight Explorer
 * 
 * This file contains the core domain types used throughout the explorer
 * to represent blockchain data structures.
 */

/**
 * Represents a block in the Midnight blockchain
 */
export interface Block {
  /** Block height (number of blocks from genesis) */
  height: number;
  /** Block hash identifier */
  hash: string;
  /** ISO timestamp when the block was created */
  timestamp: string;
  /** Number of transactions included in this block */
  txCount: number;
}

/**
 * Represents a transaction in the Midnight blockchain
 */
export interface Transaction {
  /** Transaction hash identifier */
  hash: string;
  /** Current status of the transaction */
  status: 'success' | 'failed' | 'pending';
  /** Height of the block containing this transaction (if confirmed) */
  blockHeight?: number;
  /** ISO timestamp when the transaction was included in a block (if confirmed) */
  timestamp?: string;
  /** Size of the transaction in bytes */
  size?: number;
}

/**
 * Summary information about an address on the Midnight blockchain
 */
export interface AddressSummary {
  /** The address in bech32m format */
  address: string;
  /** Current balance (if available) */
  balance?: string;
  /** Number of transactions associated with this address */
  txCount?: number;
}

/**
 * Generic pagination wrapper for API responses
 */
export interface Page<T> {
  /** Array of items for the current page */
  items: T[];
  /** Optional cursor for fetching the next page of results */
  nextCursor?: string;
}
