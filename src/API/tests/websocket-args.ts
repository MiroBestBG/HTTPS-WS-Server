console.clear();
import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { debugType, DIR } from "../../shared/schemas/misc.ts";
import { CONFIG_FILE } from "../../shared/schemas/api.d.ts";
import { fetchServer, Utilities } from "../../shared/utils/utils.ts";
import { API_Stages } from "../../shared/utils/api.ts";
import { misc } from "../../shared/utils/config.ts";
import { assertStrictEquals } from "@std/assert/strict-equals";

const configFile = JSON.parse(Deno.readTextFileSync(`${DIR.DB}/config.json`)) as CONFIG_FILE;
const token =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGF0dXMiOiJBQ1RJVkUiLCJjcmVhdGVkQnkiOiJ7XCJyZWZlcnJlclwiOlwiQWJyb2FkXCIsXCJrZXlcIjpcImRwQnljdFIwenY1b0hoZVZGN1dtaTNtaklkZnpmVmNtclhkRmhPTUdySVk9XCJ9IiwidGl0bGUiOiJTZXNzaW9uIFRlc3QgRW52IChFeHBpcmluZyAyMDU3KSIsImRlc2NyaXB0aW9uIjoiSGVsbG8gd29ybGQhIiwia2V5IjoidzlVd09jdzNqa1orQnEzVkRMbExGOG1KMXc5MU4zVXJIODFVN3MrU2w5QT0iLCJqd3RLZXkiOiIiLCJzY29wZXMiOiJ7XCJnbG9iYWxcIjp7XCJzZXNzaW9uOmRlbGV0ZVwiOjI3NTUwOTA1NjYsXCJzZXNzaW9uOmNyZWF0ZVwiOjI3NTUwOTA1NjZ9fSIsImFsbG93ZWRNZXRob2RzIjoiW1wiUFVUXCIsXCJQQVRDSFwiLFwiREVMRVRFXCJdIiwiYWxsb3dlZFN0YWdlcyI6IltcIkRFVkVMT1BNRU5UXCJdIiwiY3JlYXRlZEF0IjoxNzU1MDkwNzMwLCJleHBpcmVzQXQiOjI3NTUwOTA1NjYsImlhdCI6MTc1NTA5MDczMCwiZXhwIjo0NTEwMTgxMjk2fQ.3vFtf9pFL8NzdsEdUXAHCfrjpiZu8ON5pg3TBRQVf60";
const expiredToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGF0dXMiOiJBQ1RJVkUiLCJjcmVhdGVkQnkiOiJ7XCJyZWZlcnJlclwiOlwiQWJyb2FkXCIsXCJrZXlcIjpcImRwQnljdFIwenY1b0hoZVZGN1dtaTNtaklkZnpmVmNtclhkRmhPTUdySVk9XCJ9IiwidGl0bGUiOiJFeHBpcmVkIFNlc3Npb24gVGVzdCBFbnYiLCJkZXNjcmlwdGlvbiI6IkhlbGxvIHdvcmxkISIsImtleSI6Ilg4UE43VTZxYVFrYmFSbE5mTGF2dVA2cnlTcTBJclFsWThDUmdFVEIvaTg9Iiwiand0S2V5IjoiIiwic2NvcGVzIjoie1wiZ2xvYmFsXCI6e1wic2Vzc2lvbjpkZWxldGVcIjoxNzU1MDkwNTY2LFwic2Vzc2lvbjpjcmVhdGVcIjoxNzU1MDkwNTY2fX0iLCJhbGxvd2VkTWV0aG9kcyI6IltcIlBVVFwiLFwiUEFUQ0hcIixcIkRFTEVURVwiXSIsImFsbG93ZWRTdGFnZXMiOiJbXCJERVZFTE9QTUVOVFwiXSIsImNyZWF0ZWRBdCI6MTc1NTA5MDY4MywiZXhwaXJlc0F0IjoxNzU1MDkwNTY2LCJpYXQiOjE3NTUwOTA2ODMsImV4cCI6MzUxMDE4MTI0OX0.pXvePNz7T1DoPNC_zKcIiIQYgUzRDyU0f5NP3ahm0pw";
const suspendedToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGF0dXMiOiJBQ1RJVkUiLCJjcmVhdGVkQnkiOiJ7XCJyZWZlcnJlclwiOlwiQWJyb2FkXCIsXCJrZXlcIjpcImRwQnljdFIwenY1b0hoZVZGN1dtaTNtaklkZnpmVmNtclhkRmhPTUdySVk9XCJ9IiwidGl0bGUiOiJTZXNzaW9uIFRlc3QgRW52IChTdXNwZW5kZWQpIiwiZGVzY3JpcHRpb24iOiJIZWxsbyB3b3JsZCEiLCJrZXkiOiIrUXh3bkdGc3VseW16anJ0TkJTY1kxeUJMNERFdDVYRTJkU1JZdi81Y1owPSIsImp3dEtleSI6IiIsInNjb3BlcyI6IntcImdsb2JhbFwiOntcInNlc3Npb246ZGVsZXRlXCI6Mjc1NTA5MDU2NixcInNlc3Npb246Y3JlYXRlXCI6Mjc1NTA5MDU2Nn19IiwiYWxsb3dlZE1ldGhvZHMiOiJbXCJQVVRcIixcIlBBVENIXCIsXCJERUxFVEVcIl0iLCJhbGxvd2VkU3RhZ2VzIjoiW1wiREVWRUxPUE1FTlRcIl0iLCJjcmVhdGVkQXQiOjE3NTUwOTEwOTgsImV4cGlyZXNBdCI6Mjc1NTA5MDU2NiwiaWF0IjoxNzU1MDkxMDk4LCJleHAiOjQ1MTAxODE2NjR9.xg4uKWas7akz93B2BTKWjQjpi7THbmj8WPJVBtDvjN0";
const modifiedToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUsInN0YXR1cyI6IkFDVElWRSIsImNyZWF0ZWRCeSI6IntcInJlZmVycmVyXCI6XCJBYnJvYWRcIixcImtleVwiOlwiN0Y3UXJYZmd1RkdQV3ZSb2VPOFoyZm1RTkVDQ2pFOVIzeVlWbFk5Uk56ND1cIn0iLCJ0aXRsZSI6IlRlc3QiLCJkZXNjcmlwdGlvbiI6IkhlbGxvIHdvcmxkISIsImtleSI6ImRwQnljdFIwenY1b0hoZVZGN1dtaTNtaklkZnpmVmNtclhkRmhPTUdySVk9Iiwiand0S2V5IjoiZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnpkR0YwZFhNaU9pSkJRMVJKVmtVaUxDSmpjbVZoZEdWa1Fua2lPaUo3WENKeVpXWmxjbkpsY2x3aU9sd2lRV0p5YjJGa1hDSXNYQ0pyWlhsY0lqcGNJamRHTjFGeVdHWm5kVVpIVUZkMlVtOWxUemhhTW1adFVVNUZRME5xUlRsU00zbFpWbXhaT1ZKT2VqUTlYQ0o5SWl3aWRHbDBiR1VpT2lKVVpYTjBJaXdpWkdWelkzSnBjSFJwYjI0aU9pSklaV3hzYnlCM2IzSnNaQ0VpTENKclpYa2lPaUprY0VKNVkzUlNNSHAyTlc5SWFHVldSamRYYldremJXcEpaR1o2WmxaamJYSllaRVpvVDAxSGNrbFpQU0lzSW1wM2RFdGxlU0k2SWlJc0luTmpiM0JsY3lJNkludGNJbWRzYjJKaGJGd2lPbnRjSW5ObGMzTnBiMjQ2WkdWc1pYUmxYQ0k2TWpjeU56STNOekkzTEZ3aWMyVnpjMmx2YmpwamNtVmhkR1ZjSWpveU56STNNamMzTWpkOWZTSXNJbUZzYkc5M1pXUk5aWFJvYjJSeklqb2lXMXdpVUZWVVhDSmRJaXdpWVd4c2IzZGxaRk4wWVdkbGN5STZJbHRjSWxCU1QwUlZRMVJKVDA1Y0lsMGlMQ0pqY21WaGRHVmtRWFFpT2pFM05UVXdOemMwT1RBc0ltVjRjR2x5WlhOQmRDSTZNalV5TkRZd09EQXdNQ3dpYVdGMElqb3hOelUxTURjM05Ea3dMQ0psZUhBaU9qUXlOemsyT0RVME9UQjkuUzFOTHhOVlVmUnZUNkExaDdUWUVpMlJjZFFsQ3doWXEteDB3M2NLbjViMCIsInNjb3BlcyI6eyJnbG9iYWwiOnsic2Vzc2lvbjpkZWxldGUiOjI3MjcyNzcyNywic2Vzc2lvbjpjcmVhdGUiOjI3MjcyNzcyN319LCJhbGxvd2VkTWV0aG9kcyI6WyJERUxFVEUiLCJHRVQiLCJQQVRDSCJdLCJhbGxvd2VkU3RhZ2VzIjpbIlBST0RVQ1RJT04iXSwiY3JlYXRlZEF0IjoxNzU1MDc3NDkwLCJleHBpcmVzQXQiOjI1MjQ2MDgwMDAsImlhdCI6MTc1NTA5NTA2NiwiZXhwIjo0Mjc5NzAzMDY2fQ.AYMG2c8OX5mZz-gv1vPBggQQzdkfNsPc1Ounr9orLi8";
async function checkIfServerIsAlive() {
	try {
		const res = await fetch(`https://localhost:${misc.config.server.port}/server/status?auth=${token}&version=${misc.config.version}`, {
			method: "GET",
		});

		const data = JSON.parse(await res.json());
		const versionMatches = data.version === misc.config.version.toString();

		versionMatches ? Utilities.debugLog(debugType.SUCCESS, "Server is running", { fileDir: import.meta.filename }) : Utilities.debugLog(debugType.MAJOR_ERROR, "Server is not running", { fileDir: import.meta.filename });

		return versionMatches;
	} catch (err: any) {
		Utilities.debugLog(debugType.MAJOR_ERROR, "Server is not running", { fileDir: import.meta.filename });
		throw new Error(`Server is not running`);
		return false;
	}
}
describe("Websocket Connection", () => {
	beforeAll(async () => {
		await checkIfServerIsAlive();
	});
	describe("Validate Initial Args", () => {
		it("Validates Version of WS Connection", async () => {
			await new Promise<void>((resolve, reject) => {
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=0`);

				// Safety timeout so the test can't hang forever
				const timeout = setTimeout(() => {
					if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
						socket.close();
					}
					reject(new Error("Timed out waiting for WebSocket message"));
				}, 2000);

				const cleanup = () => clearTimeout(timeout);

				socket.addEventListener("error", (err) => {
					cleanup();
					if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
						socket.close();
					}
					reject(err);
				});

				socket.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data);

						// if (data.code === 530) {
						// 	Utilities.debugLog(debugType.SUCCESS, "Connected to the server", {
						// 		fileDir: import.meta.filename,
						// 	});
						// } else if (data.code >= 525 && data.code < 530) {
						// 	Utilities.debugLog(debugType.MAJOR_ERROR, `Couldn't connect to the server (${data.message})`, {
						// 		fileDir: import.meta.filename,
						// 	});
						// }

						assertStrictEquals(data.code, 525, "Code should be 525");
						cleanup();
						socket.close(); // initiate close, but don't resolve yet
						resolve();
					} catch (e) {
						cleanup();
						socket.close();
						reject(e);
					}
				});

				// Only resolve when the WebSocket is *actually* closed
				socket.addEventListener("close", () => {
					resolve();
				});
			});
		});

		it("Attempts to connect without a token", async () => {
			await new Promise<void>((resolve, reject) => {
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}`);

				// Safety timeout so the test can't hang forever
				const timeout = setTimeout(() => {
					socket.close();
					reject(new Error("Timed out waiting for WebSocket message"));
				}, 2000); // 2s

				socket.addEventListener("error", (err) => {
					clearTimeout(timeout);
					socket.close();
					reject(err);
				});

				socket.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data);

						// if (data.code === 530) {
						// 	Utilities.debugLog(debugType.SUCCESS, "Connected to the server", {
						// 		fileDir: import.meta.filename,
						// 	});
						// } else if (data.code >= 525 && data.code < 530) {
						// 	Utilities.debugLog(debugType.MAJOR_ERROR, `Couldn't connect to the server (${data.message})`, {
						// 		fileDir: import.meta.filename,
						// 	});
						// }

						assertStrictEquals(data.code, 526);
						clearTimeout(timeout);
						socket.close();
						resolve();
					} catch (e) {
						clearTimeout(timeout);
						socket.close();
						reject(e);
					}
				});
			});
		});
		it("Attempts to connect with an invalid token", async () => {
			await new Promise<void>((resolve, reject) => {
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=test`);

				// Safety timeout so the test can't hang forever
				const timeout = setTimeout(() => {
					socket.close();
					reject(new Error("Timed out waiting for WebSocket message"));
				}, 2000); // 2s

				socket.addEventListener("error", (err) => {
					clearTimeout(timeout);
					socket.close();
					reject(err);
				});

				socket.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data);

						// if (data.code === 530) {
						// 	Utilities.debugLog(debugType.SUCCESS, "Connected to the server", {
						// 		fileDir: import.meta.filename,
						// 	});
						// } else if (data.code >= 525 && data.code < 530) {
						// 	Utilities.debugLog(debugType.MAJOR_ERROR, `Couldn't connect to the server (${data.message})`, {
						// 		fileDir: import.meta.filename,
						// 	});
						// }

						assertStrictEquals(data.code, 526);
						clearTimeout(timeout);
						socket.close();
						resolve();
					} catch (e) {
						clearTimeout(timeout);
						socket.close();
						reject(e);
					}
				});
			});
		});
		it("Attempts to connect with an suspended token", async () => {
			await new Promise<void>((resolve, reject) => {
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=${suspendedToken}`);

				// Safety timeout so the test can't hang forever
				const timeout = setTimeout(() => {
					socket.close();
					reject(new Error("Timed out waiting for WebSocket message"));
				}, 2000); // 2s

				socket.addEventListener("error", (err) => {
					clearTimeout(timeout);
					socket.close();
					reject(err);
				});

				socket.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data);

						// if (data.code === 530) {
						// 	Utilities.debugLog(debugType.SUCCESS, "Connected to the server", {
						// 		fileDir: import.meta.filename,
						// 	});
						// } else if (data.code >= 525 && data.code < 530) {
						// 	Utilities.debugLog(debugType.MAJOR_ERROR, `Couldn't connect to the server (${data.message})`, {
						// 		fileDir: import.meta.filename,
						// 	});
						// }

						assertStrictEquals(data.code, 529);
						clearTimeout(timeout);
						socket.close();
						resolve();
					} catch (e) {
						clearTimeout(timeout);
						socket.close();
						reject(e);
					}
				});
			});
		});
		it("Attempts to connect with an expired token", async () => {
			await new Promise<void>((resolve, reject) => {
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=${expiredToken}`);

				// Safety timeout so the test can't hang forever
				const timeout = setTimeout(() => {
					socket.close();
					reject(new Error("Timed out waiting for WebSocket message"));
				}, 2000); // 2s

				socket.addEventListener("error", (err) => {
					clearTimeout(timeout);
					socket.close();
					reject(err);
				});

				socket.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data);

						// if (data.code === 530) {
						// 	Utilities.debugLog(debugType.SUCCESS, "Connected to the server", {
						// 		fileDir: import.meta.filename,
						// 	});
						// } else if (data.code >= 525 && data.code < 530) {
						// 	Utilities.debugLog(debugType.MAJOR_ERROR, `Couldn't connect to the server (${data.message})`, {
						// 		fileDir: import.meta.filename,
						// 	});
						// }

						assertStrictEquals(data.code, 528);
						clearTimeout(timeout);
						socket.close();
						resolve();
					} catch (e) {
						clearTimeout(timeout);
						socket.close();
						reject(e);
					}
				});
			});
		});
		it("Attempts to connect with a modified token", async () => {
			await new Promise<void>((resolve, reject) => {
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=${modifiedToken}`);

				// Safety timeout so the test can't hang forever
				const timeout = setTimeout(() => {
					socket.close();
					reject(new Error("Timed out waiting for WebSocket message"));
				}, 2000); // 2s

				socket.addEventListener("error", (err) => {
					clearTimeout(timeout);
					socket.close();
					reject(err);
				});

				socket.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data);

						// if (data.code === 530) {
						// 	Utilities.debugLog(debugType.SUCCESS, "Connected to the server", {
						// 		fileDir: import.meta.filename,
						// 	});
						// } else if (data.code >= 525 && data.code < 530) {
						// 	Utilities.debugLog(debugType.MAJOR_ERROR, `Couldn't connect to the server (${data.message})`, {
						// 		fileDir: import.meta.filename,
						// 	});
						// }

						assertStrictEquals(data.code, 527);
						clearTimeout(timeout);
						socket.close();
						resolve();
					} catch (e) {
						clearTimeout(timeout);
						socket.close();
						reject(e);
					}
				});
			});
		});
	});
	describe("Able to connect", () => {
		it("Connects to the server with all correct parameters", async () => {
			await new Promise<void>((resolve, reject) => {
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=${token}`);

				// Safety timeout so the test can't hang forever
				const timeout = setTimeout(() => {
					if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
						socket.close();
					}
					reject(new Error("Timed out waiting for WebSocket message"));
				}, 2000);

				const cleanup = () => clearTimeout(timeout);

				socket.addEventListener("error", (err) => {
					cleanup();
					reject(err);
				});

				socket.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data);
						assertStrictEquals(data.code, 530);

						cleanup();
						socket.close();
					} catch (e) {
						cleanup();
						socket.close();
						reject(e);
					}
				});

				socket.addEventListener("close", () => {
					resolve();
				});
			});
		});
	});
});
