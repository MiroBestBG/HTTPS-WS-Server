export const DIR = {
	MAIN: Deno.cwd().toString(),
	SRC: `${Deno.cwd().toString()}/src`,
	API: {
		MAIN: `${Deno.cwd().toString()}/src/API`,
		REQUESTS: `${Deno.cwd().toString()}/src/API/requests`,
		TESTS: `${Deno.cwd().toString()}/src/API/tests`,
	},
	DB: `${Deno.cwd().toString()}/src/db`,
	SHARED: {
		MAIN: `${Deno.cwd().toString()}/src/shared` as string,
		SHARED_SCHEMA: `${Deno.cwd().toString()}/src/shared/schemas`,
		SHARED_UTILS: `${Deno.cwd().toString()}/src/shared/utils`,
	},
} as const;

export const debugType = {
	MAJOR_ERROR: "MAJOR_ERROR",
	MINOR_ERROR: "MINOR_ERROR",
	WARN: "WARN",
	SUCCESS: "SUCCESS",
	DEBUG: "DEBUG",
	RESET: "RESET",
	TEST_SUCCESS: "TEST_SUCCESS",
	TEST_FAIL: "TEST_FAIL",
} as const;

export type debugTypes = (typeof debugType)[keyof typeof debugType];

export const terminalColor = (type: debugTypes): string | undefined => {
	const colors: { [key in debugTypes]: string } = {
		MAJOR_ERROR: "\x1b[31m", // Red
		MINOR_ERROR: "\x1b[38;5;202m", // Orange
		WARN: "\x1b[33m", // Yellow
		SUCCESS: "\x1b[32m", // Green
		DEBUG: "\x1b[34m", // Blue
		RESET: "\x1b[0m", // Reset
		TEST_SUCCESS: "\x1b[32m", // Green
		TEST_FAIL: "\x1b[31m", // Red
	};
	return colors[type];
};

export const emojiMap: Partial<Record<debugTypes, string>> = {
	MAJOR_ERROR: "❌",
	MINOR_ERROR: "🚫",
	WARN: "⚠️",
	SUCCESS: "✅",
	DEBUG: "🐞",
	TEST_SUCCESS: "🧪✅",
	TEST_FAIL: "🧪❌",
};

export interface DebugLogOptions {
	isSevere?: boolean;
	fileDir?: string;
	json?: unknown;
}
export interface CallbackCodeInfo {
	code: number;
	description: string;
}

export const CallbackCodes = {
	WEBSOCKET_CONNECTION_VERSION_MISMATCH: {
		code: 525,
		description: "WebSocket connection version mismatch.",
	},
	WEBSOCKET_CONNECTION_TOKEN_INVALID: {
		code: 526,
		description: "WebSocket connection token empty/invalid.",
	},
	WEBSOCKET_CONNECTION_TOKEN_OUT_OF_SYNC: {
		code: 527,
		description: "WebSocket connection token is out of sync to that of the server.",
	},
	WEBSOCKET_CONNECTION_TOKEN_EXPIRED: {
		code: 528,
		description: "WebSocket connection token has expired.",
	},
	WEBSOCKET_CONNECTION_ALREADY_CONNECTED: {
		code: 529,
		description: "WebSocket is already in use elsewhere.",
	},
	WEBSOCKET_CONNECTION_SESSION_NOT_ACTIVE: {
		code: 529,
		description: "WebSocket session status isn't activated.",
	},
	WEBSOCKET_CONNECTION_SESSION_ESTABLISHED: {
		code: 530,
		description: "WebSocket session has been established.",
	},
} as const;

export const CallbackCode = Object.fromEntries(Object.entries(CallbackCodes).map(([key, val]) => [key, val.code])) as { [K in keyof typeof CallbackCodes]: number };
export const CallbackDescription = Object.fromEntries(Object.entries(CallbackCodes).map(([key, val]) => [key, val.description])) as { [K in keyof typeof CallbackCodes]: string };
const codeToDescriptionMap: Record<number, string> = Object.fromEntries(Object.values(CallbackCodes).map(({ code, description }) => [code, description]));

export function getDescriptionByCode(code: number): string | undefined {
	return codeToDescriptionMap[code];
}

export const permissionsMap = {
	"session/manage": "session:",
	"session/create": "session:create",
	"session/delete": "session:delete",

	"server/status": "server:status",
} as const;
import { Session } from "../utils/api.ts";
export function hasPermission(session: Session, permission: keyof typeof permissionsMap, scope?: "global" | string): boolean {
	const permKey: keyof typeof session.scopes.global = permissionsMap[permission];
	const now = Date.now() / 1000;

	const globalExpiry = session.scopes.global[permKey];
	if (typeof globalExpiry === "number" && globalExpiry > now) {
		return true;
	}

	if (scope && session.scopes[scope]) {
		const scopeExpiry = session?.scopes?.[scope]?.[permKey];
		if (typeof scopeExpiry === "number" && scopeExpiry > now) {
			return true;
		}
	}

	return false;
}
