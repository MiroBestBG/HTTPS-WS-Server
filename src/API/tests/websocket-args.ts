console.clear();
import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { debugType, DIR } from "../../shared/schemas/misc.ts";
// import { CONFIG_FILE } from "../../shared/schemas/api.d.ts";
import { Utilities } from "../../shared/utils/utils.ts";
import { misc } from "../../shared/utils/config.ts";
import { assertStrictEquals } from "@std/assert/strict-equals";

// const configFile = JSON.parse(Deno.readTextFileSync(`${DIR.DB}/config.json`)) as CONFIG_FILE;
import { parse } from "@std/dotenv/parse";
import { ENV_FILE } from "../types.d.ts";
const ENV = parse(Deno.readTextFileSync(`${DIR.MAIN}/.env`)) as unknown as ENV_FILE;

async function checkIfServerIsAlive() {
	try {
		const res = await fetch(`https://localhost:${misc.config.server.port}/server/status?auth=${ENV.token}&version=${misc.config.version}`, {
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
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=${ENV.suspendedToken}`);

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
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=${ENV.expiredToken}`);

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
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=${ENV.modifiedToken}`);

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
				const socket = new WebSocket(`wss://localhost:${misc.config.server.port}?version=${misc.config.version}&token=${ENV.token}`);

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
