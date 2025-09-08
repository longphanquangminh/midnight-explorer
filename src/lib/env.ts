/**
 * Environment variables helper for Midnight Explorer
 * Provides safe access to configuration values with defaults
 */

/**
 * URL for the Midnight testnet indexer API
 * Set via NEXT_PUBLIC_INDEXER_URL environment variable
 */
export const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || "";

/**
 * URL for the Midnight testnet RPC node
 * Set via NEXT_PUBLIC_RPC_URL environment variable
 */
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "";

/**
 * Flag to determine if mock data should be used
 * Set to false only when USE_MOCK_DATA="0" is explicitly configured
 * Defaults to true for easier development without endpoints
 */
export const USE_MOCK = process.env.USE_MOCK_DATA !== "0";
