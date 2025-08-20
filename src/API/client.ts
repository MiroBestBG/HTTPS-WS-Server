console.clear();
import { debugType, DIR } from "../shared/schemas/misc.ts";
import { misc } from "../shared/utils/config.ts";
import { Utilities } from "../shared/utils/utils.ts";
import { assertStrictEquals } from "@std/assert/strict-equals";
import { parse } from "@std/dotenv/parse";
import { ENV_FILE } from "./types.d.ts";
const ENV = parse(Deno.readTextFileSync(`${DIR.MAIN}/.env`)) as unknown as ENV_FILE;
const token = ENV.token;
const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?token=${token}&version=${misc.config.version}`);

socket.onmessage = (event) => {
	try {
		const data = JSON.parse(event.data);
		if (data.code == 530) return Utilities.debugLog(debugType.SUCCESS, `Connected to the server`, { fileDir: import.meta.filename });
		if (data.code >= 525 && data.code < 530) Utilities.debugLog(debugType.MAJOR_ERROR, `Couldn't connect to the server`, { fileDir: import.meta.filename, json: data.message }); // Error codes for websocket connections
		assertStrictEquals(data.code, 525);
		// Handle JSON message here
	} catch {
		// Handle non-JSON message here
	}
};
