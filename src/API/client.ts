console.clear();
import jwt, { JwtPayload } from "jsonwebtoken";
import { debugType } from "../shared/schemas/misc.ts";
import { misc } from "../shared/utils/config.ts";
import Cryptography from "../shared/utils/encryption.ts";
import { Utilities } from "../shared/utils/utils.ts";
import { API_Stages } from "../shared/utils/api.ts";
import { assertStrictEquals } from "@std/assert/strict-equals";
const token =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGF0dXMiOiJBQ1RJVkUiLCJjcmVhdGVkQnkiOiJUZXN0IiwidGl0bGUiOiJUZXN0IiwiZGVzY3JpcHRpb24iOiJUZXN0Iiwia2V5IjoiUm1NZDBzZHl2L1Fsbll2RlhqYkg5QzFmQTBJR3JVdlZlbW9xTW9NZkQxbz0iLCJqd3RLZXkiOiIiLCJzY29wZXMiOiJ7XCJnbG9iYWxcIjp7XCJzZXNzaW9uOmNyZWF0ZVwiOjI3MjcyNzcyNyxcInNlc3Npb246ZGVsZXRlXCI6MjcyNzI3NzI3fX0iLCJhbGxvd2VkTWV0aG9kcyI6IltcIkRFTEVURVwiLFwiR0VUXCIsXCJQQVRDSFwiLFwiUE9TVFwiLFwiUFVUXCJdIiwiYWxsb3dlZFN0YWdlcyI6IltcIkFMTFwiXSIsImNyZWF0ZWRBdCI6MTc1NDk5MzQ3MiwiZXhwaXJlc0F0IjoyNTI0NjA4MDAwLCJpYXQiOjE3NTQ5OTM0NzIsImV4cCI6NDI3OTYwMTQ3Mn0.-C6S2G-ZXx2u7W-_7j7dO70xlHaKxpBR3vdGLUzAUfU";
const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?token=${token}`);

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
