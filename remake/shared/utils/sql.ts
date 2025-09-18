import { dbFilenames, DatabaseSchema } from "../schemas/sql.ts";
import { Database as DatabaseAsync, open } from "npm:sqlite";
import sqlite3 from "npm:sqlite3";
import { Utilities } from "./utils.ts";
import { debugType } from "../schemas/misc.ts";

const Database = sqlite3.Database;

export class SQL {
	private initiated: boolean = false;
	private databaseFiles: Array<DatabaseAsync<sqlite3.Database, sqlite3.Statement>> = [];
	constructor() {}

	async getDatabase(filename: string) {
		if (!this.initiated) await this.init();
		return this.databaseFiles.filter((a) => a.config.filename === filename)[0];
	}
	async getColumns(file: DatabaseAsync<sqlite3.Database, sqlite3.Statement>, tableName: string): Promise<{ cid: number; name: string; type: string; notnull: 1 | 0; dflt_value: null | string; pk: 1 | 0 }[]> {
		const res = await file.all(`PRAGMA table_info(${tableName})`);
		return res as { cid: number; name: string; type: string; notnull: 1 | 0; dflt_value: null | string; pk: 1 | 0 }[];
	}
	async validateDatabase(filename: string, db?: DatabaseAsync<sqlite3.Database, sqlite3.Statement>): Promise<void> {
		if (!db) {
			if (!this.initiated) await this.init();
			db = await this.getDatabase(filename as string);
		}
		const config = DatabaseSchema.filter((a) => a.filename === filename)[0];
		for (const table of config.tables) {
			const tableExists = await db.get(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table.tableName}'`);
			// Create table with schema
			if (!tableExists) {
				const columnDefs = Object.entries(table.columns[0])
					.map(([columnName, definition]) => `${columnName} ${definition}`)
					.join(", ");

				await db.run(`CREATE TABLE IF NOT EXISTS ${table.tableName} (${columnDefs})`);
				continue;
			}

			// Table exists
			const tableColumns = (await this.getColumns(db, table.tableName)).map((a) => a.name);
			const columnsToAdd = Object.keys(table.columns[0]).filter((a) => !tableColumns.includes(a));
			for (const column of columnsToAdd) {
				const columnType = (table.columns[0] as Record<string, string>)[column];

				await db.run(`ALTER TABLE ${table.tableName} ADD COLUMN ${column} ${columnType}`);
			}
		}
	}
	async init() {
		this.databaseFiles = await Promise.all(Object.values(dbFilenames).map(async (a) => await open({ filename: a, driver: Database })));
		for await (const db of this.databaseFiles) {
			await this.validateDatabase(db.config.filename, db);
		}
		this.initiated = true;
	}

	async queryDb(filename: (typeof dbFilenames)[keyof typeof dbFilenames], query: string, flags?: Array<"testMode" | "storeDb">): Promise<[Array<Record<string, string>> | undefined, string | undefined]> {
		if (!this.initiated) await this.init();
		const testMode = flags?.includes("testMode");
		testMode == true ? filename.replace(".db", ".dev.db") : filename;
		try {
			const file = this.databaseFiles.filter((a) => a.config.filename === filename)[0];
			if (!file) return [undefined, "File not found"];

			const statement = await file.prepare(query);
			Utilities.debugLog(debugType.DEBUG, `QUERY: ${query}`, { fileDir: import.meta.filename });
			const res = await statement.all();
			if (flags?.includes("storeDb")) {
				await file.close();
				await file.open();
			}
			return [res, undefined];
			// deno-lint-ignore no-explicit-any
		} catch (err: any) {
			if (err == "SQLITE_MISUSE") {
				const file = this.databaseFiles.filter((a) => a.config.filename === filename)[0];
				const index = this.databaseFiles.indexOf(file);
				this.databaseFiles[index] = await open({ filename: `${file.config.filename}`, driver: Database });
				return this.queryDb(filename, query);
			}
			return [undefined, `${err?.message} | ${err?.code}`];
		}
	}
	// deno-lint-ignore no-explicit-any
	async queryValuesDb(filename: (typeof dbFilenames)[keyof typeof dbFilenames], query: string, values?: any[], testMode?: boolean): Promise<[Array<Record<string, string>> | undefined, string | undefined]> {
		if (!this.initiated) await this.init();
		testMode == true ? filename.replace(".db", ".dev.db") : filename;
		try {
			const file = this.databaseFiles.filter((a) => a.config.filename === filename)[0];
			if (!file) return [undefined, "File not found"];

			const statement = await file.prepare(query);
			Utilities.debugLog(debugType.DEBUG, `QUERY: ${query}`, { fileDir: import.meta.filename, json: values });
			const res = values ? await statement.all(values) : await statement.all();

			return [res, undefined];
			// deno-lint-ignore no-explicit-any
		} catch (err: any) {
			if (err == "SQLITE_MISUSE") {
				const file = this.databaseFiles.filter((a) => a.config.filename === filename)[0];
				const index = this.databaseFiles.indexOf(file);
				this.databaseFiles[index] = await open({ filename: `${file.config.filename}`, driver: Database });
				return this.queryValuesDb(filename, query, values, testMode);
			}
			return [undefined, `${err?.message} | ${err?.code}`];
		}
	}
	async insertDb(filename: (typeof dbFilenames)[keyof typeof dbFilenames], tableNames: string, rowData: Record<string, string | number | boolean>, flags?: Array<"replace" | "storeDb">): Promise<string | undefined> {
		if (!this.initiated) await this.init();
		const file = this.databaseFiles.filter((a) => a.config.filename === filename)[0];

		const placeholders = Object.keys(rowData)
			.map(() => "?")
			.join(", ");
		const columns = Object.keys(rowData).join(", ");
		const values = Object.values(rowData);

		const query = `INSERT ${flags?.includes("replace") == false ? "" : "OR REPLACE"} INTO ${tableNames} (${columns}) VALUES (${placeholders})`;
		try {
			await file.run(query, values);
			if (flags?.includes("storeDb")) {
				await file.close();
				await file.open();
			}
			return undefined;
		} catch (err) {
			if (err == "SQLITE_MISUSE") {
				const file = this.databaseFiles.filter((a) => a.config.filename === filename)[0];
				const index = this.databaseFiles.indexOf(file);
				this.databaseFiles[index] = await open({ filename: `${file.config.filename}`, driver: Database });
				return this.insertDb(filename, tableNames, rowData, flags);
			}
			return err as unknown as string;
		}
	}
	objectToQueryCondition(object: object, flags?: Array<"OR" | "Sanitise">) {
		return Object.entries(object)
			.map(([key, value]) => `${key} = ${flags?.includes("Sanitise") ? "?" : `'${value}'`}`)
			.join(flags?.includes("OR") ? " OR " : " AND ");
	}
}
