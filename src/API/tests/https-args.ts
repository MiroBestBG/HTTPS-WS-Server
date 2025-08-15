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
// deno-lint-ignore no-explicit-any
async function fetchFromServer(route: string, headers: RequestInit, optional?: { auth: string; version: string }): Promise<[Response, any]> {
	const url = `https://localhost:${misc.config.server.port}/${route}?auth=${optional?.auth ?? token}&version=${optional?.version ?? misc.config.version}`;
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
			const [res, data] = await fetchFromServer("server/status", { method: "GET" }, { auth: suspendedToken, version: misc.config.version });

			assertStrictEquals(data.code, 403);
			clearTimeout(timeout);
		});
		it("Attempt to use an expired token", async () => {
			const timeout = setTimeout(() => {}, 2000); // 2s
			const [res, data] = await fetchFromServer("server/status", { method: "GET" }, { auth: expiredToken, version: misc.config.version });

			assertStrictEquals(data.code, 403);
			clearTimeout(timeout);
		});
		it("Attempt to use an altered token", async () => {
			const timeout = setTimeout(() => {}, 2000); // 2s
			const [res, data] = await fetchFromServer("server/status", { method: "GET" }, { auth: modifiedToken, version: misc.config.version });

			assertStrictEquals(data.code, 403);
			clearTimeout(timeout);
		});
		it("Attempt to a non existing route", async () => {
			const timeout = setTimeout(() => {}, 2000); // 2s
			const [res, data] = await fetchFromServer("not/an/existing/route", { method: "DELETE" }, { auth: token, version: misc.config.version });

			assertStrictEquals(data.code, 404);
			clearTimeout(timeout);
		});
	});
});
