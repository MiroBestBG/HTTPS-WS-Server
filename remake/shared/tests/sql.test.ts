console.clear();
import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { parse } from "@std/dotenv/parse";
import { Utilities } from "../utils/utils.ts";
import { debugType, DIR } from "../schemas/misc.ts";
import { existsSync } from "node:fs";

describe("Test shared sql.ts", () => {
	beforeAll(() => {
		const testFileDir = `${DIR.DB}/`;
		if (existsSync(testFileDir)) Deno.removeSync(testFileDir);
	});
	describe("Tests the SQL class", () => {
		it("");
	});
});
