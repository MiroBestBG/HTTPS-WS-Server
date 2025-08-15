import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils.ts";

const AES_GCM_IV_LENGTH = 12;

export class Cryptography {
	constructor() {}

	// Generate RSA and/or AES keys
	async generateKeys(type?: "RSA" | "AES"): Promise<
		Partial<{
			publicKey: CryptoKey;
			privateKey: CryptoKey;
			aesKey: CryptoKey;
		}>
	> {
		const results: Partial<{
			publicKey: CryptoKey;
			privateKey: CryptoKey;
			aesKey: CryptoKey;
		}> = {};

		if (!type || type === "RSA") {
			const rsaKeys = await crypto.subtle.generateKey(
				{
					name: "RSA-OAEP",
					modulusLength: 2048,
					publicExponent: new Uint8Array([1, 0, 1]),
					hash: "SHA-256",
				},
				true,
				["encrypt", "decrypt"]
			);
			results.publicKey = rsaKeys.publicKey;
			results.privateKey = rsaKeys.privateKey;
		}

		if (!type || type === "AES") {
			results.aesKey = await crypto.subtle.generateKey(
				{
					name: "AES-GCM",
					length: 256,
				},
				true,
				["encrypt", "decrypt"]
			);
		}

		return results;
	}

	// Encrypt data using RSA or AES
	async encrypt(key: CryptoKey, data: string, base64: true): Promise<string>;
	async encrypt(key: CryptoKey, data: string, base64?: false): Promise<ArrayBuffer>;
	async encrypt(key: CryptoKey, data: string, base64: boolean = false): Promise<ArrayBuffer | string> {
		const encoded = new TextEncoder().encode(data);

		if (key.algorithm.name === "RSA-OAEP") {
			if (encoded.byteLength > 190) {
				throw new Error("RSA encryption input too large. Use hybrid encryption for large data.");
			}
			const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, encoded);
			return base64 ? arrayBufferToBase64(encrypted) : encrypted;
		} else if (key.algorithm.name === "AES-GCM") {
			const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
			const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

			const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
			combined.set(iv, 0);
			combined.set(new Uint8Array(encrypted), iv.byteLength);

			return base64 ? arrayBufferToBase64(combined.buffer) : combined.buffer;
		} else {
			throw new Error(`Unsupported key algorithm for encryption: ${key.algorithm.name}`);
		}
	}

	// Decrypt data using RSA or AES
	async decrypt(key: CryptoKey, ciphertext: string, base64: true): Promise<string>;
	async decrypt(key: CryptoKey, ciphertext: ArrayBuffer, base64?: false): Promise<string>;
	async decrypt(key: CryptoKey, ciphertext: ArrayBuffer | string, base64: boolean = false): Promise<string> {
		const encryptedBuffer = base64 ? base64ToArrayBuffer(ciphertext as string) : (ciphertext as ArrayBuffer);

		if (key.algorithm.name === "RSA-OAEP") {
			const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, key, encryptedBuffer);
			return new TextDecoder().decode(decrypted);
		} else if (key.algorithm.name === "AES-GCM") {
			const data = new Uint8Array(encryptedBuffer);
			const iv = data.slice(0, AES_GCM_IV_LENGTH);
			const ciphertextBytes = data.slice(AES_GCM_IV_LENGTH);

			try {
				const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertextBytes);
				return new TextDecoder().decode(decrypted);
			} catch {
				throw new Error("Decryption failed: Invalid key, IV, or ciphertext.");
			}
		} else {
			throw new Error(`Unsupported key algorithm for decryption: ${key.algorithm.name}`);
		}
	}

	importPublicKey(base64: string): Promise<CryptoKey> {
		const buffer = base64ToArrayBuffer(base64);
		return crypto.subtle.importKey("spki", buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
	}

	importPrivateKey(base64: string): Promise<CryptoKey> {
		const buffer = base64ToArrayBuffer(base64);
		return crypto.subtle.importKey("pkcs8", buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
	}

	async exportPublicKey(key: CryptoKey): Promise<string> {
		const exported = await crypto.subtle.exportKey("spki", key);
		return arrayBufferToBase64(exported);
	}

	async exportPrivateKey(key: CryptoKey): Promise<string> {
		const exported = await crypto.subtle.exportKey("pkcs8", key);
		return arrayBufferToBase64(exported);
	}

	// Generate random values, return base64 or raw
	generateRandomValues(length: number, base64: true): string;
	generateRandomValues(length: number, base64?: false): Uint8Array;
	generateRandomValues(length: number, base64: boolean = false): string | Uint8Array {
		const randomValues = crypto.getRandomValues(new Uint8Array(length));
		return base64 ? arrayBufferToBase64(randomValues.buffer) : randomValues;
	}
}

export default Cryptography;
