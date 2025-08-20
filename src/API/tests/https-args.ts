console.clear();
import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { debugType, DIR } from "../../shared/schemas/misc.ts";
// import { CONFIG_FILE } from "../../shared/schemas/api.d.ts";
import { Utilities } from "../../shared/utils/utils.ts";
import { misc } from "../../shared/utils/config.ts";
import { assertStrictEquals } from "@std/assert/strict-equals";
import { ENV_FILE } from "../types.d.ts";
// const configFile = JSON.parse(Deno.readTextFileSync(`${DIR.DB}/config.json`)) as CONFIG_FILE;
import { parse } from "@std/dotenv/parse";
const ENV = parse(Deno.readTextFileSync(`${DIR.MAIN}/.env`)) as unknown as ENV_FILE;

// deno-lint-ignore no-explicit-any
async function fetchFromServer(route: string, headers: RequestInit, optional?: { auth: string; version: string }): Promise<[Response, any]> {
	const url = `https://localhost:${misc.config.server.port}/${route}?auth=${optional?.auth ?? ENV.token}&version=${optional?.version ?? misc.config.version}`;
	const res = await fetch(url, headers);

	let data;
	try {
		data = await res.json();
		// deno-lint-ignore no-empty
	} catch (_err) {}
	return [res, data];
}
async function checkIfServerIsAlive() {
	try {
		const [res] = await fetchFromServer("server/status", { method: "GET" });
		const serverAlive = res.status == 200;
		serverAlive ? Utilities.debugLog(debugType.SUCCESS, "Server is running", { fileDir: import.meta.filename }) : Utilities.debugLog(debugType.MAJOR_ERROR, "Server is not running", { fileDir: import.meta.filename });

		return serverAlive;
	} catch (err: any) {
		Utilities.debugLog(debugType.MAJOR_ERROR, "Server is not running", { fileDir: import.meta.filename });
		throw new Error(`Server is not running`);
	}
}
describe("HTTP Connection", () => {
	beforeAll(async () => {
		let timeout = setTimeout(() => {}, 2000); // 2s
		await checkIfServerIsAlive();
		clearTimeout(timeout);
	});
	describe("Validate Initial Args", () => {
		it("Attempt to request resources without a token", async () => {
			const timeout = setTimeout(() => {}, 2000); // 2s
			const [res, data] = await fetchFromServer("server/status", { method: "GET" }, { auth: "test", version: misc.config.version });

			assertStrictEquals(data.code, 401);
			clearTimeout(timeout);
		});
		it("Attempt to use a suspended token", async () => {
			const timeout = setTimeout(() => {}, 2000); // 2s
			const [res, data] = await fetchFromServer("server/status", { method: "GET" }, { auth: ENV.suspendedToken, version: misc.config.version });

			assertStrictEquals(data.code, 403);
			clearTimeout(timeout);
		});
		it("Attempt to use an expired token", async () => {
			const timeout = setTimeout(() => {}, 2000); // 2s
			const [res, data] = await fetchFromServer("server/status", { method: "GET" }, { auth: ENV.expiredToken, version: misc.config.version });

			assertStrictEquals(data.code, 403);
			clearTimeout(timeout);
		});
		it("Attempt to use an altered token", async () => {
			const timeout = setTimeout(() => {}, 2000); // 2s
			const [res, data] = await fetchFromServer("server/status", { method: "GET" }, { auth: ENV.modifiedToken, version: misc.config.version });

			assertStrictEquals(data.code, 403);
			clearTimeout(timeout);
		});
		it("Attempt to a non existing route", async () => {
			const timeout = setTimeout(() => {}, 2000); // 2s
			const [res, data] = await fetchFromServer("not/an/existing/route", { method: "DELETE" }, { auth: ENV.token, version: misc.config.version });

			assertStrictEquals(data.code, 404);
			clearTimeout(timeout);
		});
	});
});
