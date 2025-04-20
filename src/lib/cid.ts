import { CID } from 'multiformats';
import { base58btc } from 'multiformats/bases/base58';

/**
 * Converts a CID string (v0 or v1) to bytes32 format for on-chain storage
 * Handles CIDs with '/ipfs/' prefix and optional filenames
 * @param cidWithPossiblePrefix - CID string that may include '/ipfs/' prefix and/or filename
 * @returns bytes32 hex string
 */
export function cidToBytes32(cidWithPossiblePrefix: string): string {
    // Extract just the CID part (remove '/ipfs/' prefix and any filename after)
    const cidStr = cidWithPossiblePrefix.replace('/ipfs/', '').split('/')[0];
    
    // Parse CID and get the digest (works with both CIDv0 and CIDv1)
    const digest = CID.parse(cidStr).multihash.digest;
    
    // Convert to bytes32 hex
    return '0x' + [...digest].map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts a bytes32 hex string back to a CIDv0
 * @param bytes32Hex - bytes32 hex string (with or without '0x' prefix)
 * @returns CIDv0 string
 */
export function bytes32ToCidV0(bytes32Hex: string): string {
    // Ensure the hex string starts with '0x' and remove it
    const normalizedHex = bytes32Hex.startsWith('0x') ? bytes32Hex.slice(2) : bytes32Hex;
    
    // Convert hex string back to digest bytes
    const digestFromChain = Uint8Array.from(
        normalizedHex.match(/.{2}/g)!.map(h => parseInt(h, 16))
    );
    
    // Build multihash: 0x12 (sha2-256) + 0x20 (32-byte len) + digest
    const multihash = new Uint8Array(34);
    multihash.set([0x12, 0x20]); // sha2-256 + 32-byte length
    multihash.set(digestFromChain, 2);
    
    // Encode to base58btc and remove leading 'z' if present
    const encoded = base58btc.encode(multihash);
    return encoded.startsWith('z') ? encoded.slice(1) : encoded;
} 