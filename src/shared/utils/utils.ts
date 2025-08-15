import { DebugLogOptions, debugType, debugTypes, emojiMap, terminalColor } from "../schemas/misc.ts";
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (const b of bytes) {
		binary += String.fromCharCode(b);
	}
	return btoa(binary); // Base64 encode
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

export async function fetchServer(url: string, headers: RequestInit): Promise<Response> {
	// const client = Deno.createHttpClient({
	// 	cert: misc.certs.CA, // client cert
	// 	key: misc.certs.KEY, // private key
	// 	caCerts: ["ca.pem"], // CA cert to trust server
	// });

	const response = await fetch(url, headers);
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	return response;
}

export class Utilities {
	public static sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	public static debugLog(type: debugTypes, text: string, options: DebugLogOptions = {}): void {
		const { isSevere = false, fileDir } = options;

		const color = terminalColor(type) ?? "";
		const reset = terminalColor(debugType.RESET);
		const emoji = emojiMap[type] ?? "";

		// First line: main log
		const mainLine = `${color}${emoji} [${type}] | ${text}${reset}`;

		// Second line: formatted flags, if any
		const flagLines: string[] = [];
		if (isSevere) flagLines.push(`${terminalColor(debugType.MAJOR_ERROR)}🔥 Severity: HIGH ${terminalColor(debugType.RESET)}`);
		if (options.json) flagLines.push(`📝 JSON: ${JSON.stringify(options.json)}`);
		if (fileDir) flagLines.push(`📁 Location: ${fileDir.replace(Deno.cwd(), "")}`);

		const formattedFlags = flagLines.length > 0 ? `\n  ${flagLines.join("\n  ")}` : "";

		console.info(`${mainLine}${formattedFlags}`);
	}
}
