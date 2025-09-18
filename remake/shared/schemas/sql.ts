import { DIR } from "./misc.ts";
/* Layout of all databases */
export const DatabaseSchema = [
	/* DEBUG DB (USED FOR TESTS) */
	{
		filename: `${DIR.DB}/localTests.db`,
		referenceName: "localTests",
		tables: [
			{
				tableName: "test",
				columns: [
					{
						case: "INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT",
						id: "TEXT NOT NULL",
						displayName: "TEXT NOT NULL",
						createdAt: "NUMBER NOT NULL",
					},
				],
			},
		],
		name: "localTests.db",
	},

	/* MAIN DATABASES */
	{
		filename: `${DIR.DB}/config.db`,
		referenceName: "config",
		tables: [
			{
				tableName: "guildConfig",
				columns: [
					{
						id: "TEXT NOT NULL PRIMARY KEY",
						displayName: "TEXT NOT NULL",
						createdAt: "NUMBER NOT NULL",
					},
				],
			},
			{
				tableName: "sessions",
				columns: [
					{
						id: "INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT",
						status: "TEXT NOT NULL",
						createdBy: "TEXT NOT NULL",

						title: "TEXT NOT NULL",
						description: "TEXT NOT NULL",

						key: "TEXT NOT NULL",
						jwtKey: "TEXT NOT NULL UNIQUE",

						scopes: "TEXT NOT NULL",
						allowedMethods: "TEXT NOT NULL",
						allowedStages: "TEXT NOT NULL", // Prod, Dev etc.

						createdAt: "NUMBER NOT NULL",
						expiresAt: "NUMBER NOT NULL",
					},
				],
			},
		],
		name: "config.db",
	},
	{
		filename: `${DIR.DB}/logs.db`,
		referenceName: `logs`,
		tables: [
			{
				tableName: "requests",
				columns: [
					{
						id: "INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT",
						execBy: "TEXT NOT NULL",
						at: "NUMBER NOT NULL",
						type: "TEXT NOT NULL",

						details: "TEXT NOT NULL",
					},
				],
			},
		],
	},
] as const;

export const dbFilenames = Object.fromEntries(DatabaseSchema.map((db) => [db.referenceName, db.filename])) as {
	[K in (typeof DatabaseSchema)[number]["referenceName"]]: Extract<(typeof DatabaseSchema)[number], { referenceName: K }>["filename"];
};

export const tableNames = Object.fromEntries(DatabaseSchema.map((db) => [db.referenceName, Object.fromEntries(db.tables.map((table) => [table.tableName, table.tableName]))])) as {
	[K in (typeof DatabaseSchema)[number]["referenceName"]]: {
		[T in Extract<(typeof DatabaseSchema)[number], { referenceName: K }>["tables"][number] as T["tableName"]]: T["tableName"];
	};
};
