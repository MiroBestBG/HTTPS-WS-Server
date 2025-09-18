// deno-lint-ignore-file
import { API_Methods } from "../schemas/api.ts";
import Cryptography from "./encryption.ts";
import jwt from "npm:jsonwebtoken";
import { misc } from "./config.ts";
import { Buffer } from "node:buffer";
import { SQL } from "./sql.ts";
import { dbFilenames, tableNames } from "../schemas/sql.ts";
import { permissionsMap } from "../schemas/misc.ts";

export type PermissionKey = (typeof permissionsMap)[keyof typeof permissionsMap];

export type SessionScopes = {
	global: Partial<Record<PermissionKey, number>>;
	[key: string]: Partial<Record<PermissionKey, number>>;
};
export type SessionCreateArgs = {
	title: string;
	description: string;
	createdBy: string;
	scopes: SessionScopes;
	expiresAt: number;
	allowedMethods: API_Methods[];
	allowedStages: Array<(typeof API_Stages)[keyof typeof API_Stages]>;
};
export const API_Stages = {
	PRODUCTION: "PRODUCTION",
	DEVELOPMENT: "DEVELOPMENT",
	PRE_DEVELOPMENT: "PRE_DEVELOPMENT",
	ALL: "ALL",
};
export const SessionStatus = {
	ACTIVE: "ACTIVE",
	DELETED: "DELETED",
	EXPIRED: "EXPIRED",
	SUSPENDED: "SUSPENDED",
};
export type SessionData = {
	id?: number;
	status: (typeof SessionStatus)[keyof typeof SessionStatus];
	createdBy: string;

	title: string;
	description: string;

	key: string;
	jwtKey: string;
	scopes: string;
	allowedMethods: string;
	allowedStages: string;

	createdAt: number;
	expiresAt: number;
};

export type Session = {
	id: number;
	status: (typeof SessionStatus)[keyof typeof SessionStatus];
	createdBy: string;

	title: string;
	description: string;

	key: string;
	jwtKey: string;
	allowedMethods: API_Methods[];
	allowedStages: Array<(typeof API_Stages)[keyof typeof API_Stages]>;
	scopes: SessionScopes;

	expiresAt: number;
	createdAt: number;
};

export type SessionCreateArgs_NoStrict = {
	id?: number;
	status?: (typeof SessionStatus)[keyof typeof SessionStatus];
	createdBy?: string;

	title?: string;
	description?: string;

	key?: string;
	jwtKey?: string;
	allowedMethods?: API_Methods[];
	allowedStages?: Array<(typeof API_Stages)[keyof typeof API_Stages]>;
	scopes?: SessionScopes;

	expiresAt?: number;
	createdAt?: number;
};

export class Sessions {
	private initialised: boolean = false;
	private sessions: Array<SessionData> = [];
	private db: SQL = new SQL();
	private devMode: boolean = false;
	constructor(devMode?: boolean) {
		this.devMode = devMode || false;
	}
	async init() {
		await this.db.init();
		this.initialised = true;
	}
	async exists(args: { jwtKey?: string; id?: number; key?: string }, allowedStages?: Array<(typeof API_Stages)[keyof typeof API_Stages]>, devMode?: boolean): Promise<[boolean, Session | undefined]> {
		if (!this.initialised) await this.init();
		const data = await this.get(args, devMode);
		if (!data) return [false, undefined];
		// Allowed Stage?
		const allowedStagesArray = allowedStages ?? [];
		const dbAllowedStagesArray = Array.isArray(data.allowedStages) ? data.allowedStages : [data.allowedStages];

		const isAllowed = allowedStagesArray.includes("ALL") || dbAllowedStagesArray.includes("ALL") || dbAllowedStagesArray.some((stage) => allowedStagesArray.includes(stage));

		return [data.status == SessionStatus.ACTIVE && data.expiresAt > Math.floor(Date.now() / 1000) && isAllowed, data];
	}
	async get(args: { jwtKey?: string; id?: number; key?: string }, devMode?: boolean): Promise<Session | undefined> {
		if (!this.initialised) await this.init();
		const res = (await this.db.queryValuesDb(dbFilenames.config, `SELECT * FROM ${tableNames.config.sessions} WHERE ${this.db.objectToQueryCondition(args, ["Sanitise"])}`, Object.values(args), devMode || this.devMode)).flat()[0] as unknown as SessionData;
		if (!res) return undefined;
		console.info(res);
		res.scopes = JSON.parse(res.scopes);
		res.allowedMethods = JSON.parse(res.allowedMethods);
		res.allowedStages = JSON.parse(res.allowedStages);
		if (args.jwtKey) res.jwtKey = args.jwtKey;
		return res as unknown as Session;
	}
	async create(session: SessionCreateArgs): Promise<[SessionData | undefined, string | undefined]> {
		if (!this.initialised) await this.init();
		const res: SessionData = {
			status: SessionStatus.ACTIVE,
			createdBy: session.createdBy,

			title: session.title,
			description: session.description,

			key: new Cryptography().generateRandomValues(32, true),
			jwtKey: "",
			scopes: JSON.stringify(session.scopes),
			allowedMethods: JSON.stringify(session.allowedMethods),
			allowedStages: JSON.stringify(session.allowedStages),

			createdAt: Math.floor(Date.now() / 1000),
			expiresAt: Math.floor(session.expiresAt),
		};

		res.jwtKey = jwt.sign(res, Buffer.from(misc.config.apiToken, "base64"), {
			expiresIn: res.expiresAt,
		});

		const response = await this.db.insertDb(dbFilenames.config, tableNames.config.sessions, res, ["storeDb"]);
		return response != undefined ? [undefined, `Something went wrong.\n${response}`] : [res as unknown as SessionData, undefined];
	}

	async patch(options: { jwtKey?: string; id?: number; devMode?: boolean }, session: SessionCreateArgs_NoStrict): Promise<[SessionData | undefined, string | undefined]> {
		if (!this.initialised) await this.init();
		const sessionToPatch = await this.get(options, options.devMode ?? false);

		if (!sessionToPatch) return [undefined, "Session not found"];

		sessionToPatch.jwtKey = jwt.sign(sessionToPatch, Buffer.from(misc.config.apiToken, "base64"), {
			expiresIn: sessionToPatch.expiresAt,
		});

		const response = await this.db.insertDb(dbFilenames.config, tableNames.config.sessions, sessionToPatch as any, ["storeDb", "replace"]);
		return response != undefined ? [undefined, `Something went wrong.\n${response}`] : [response as unknown as SessionData, undefined];
	}

	async delete(session: SessionCreateArgs_NoStrict, devMode?: boolean): Promise<[boolean, string | undefined]> {
		if (!this.initialised) await this.init();
		const res = await this.db.queryValuesDb(dbFilenames.config, `SELECT * FROM ${tableNames.config.sessions} WHERE ${this.db.objectToQueryCondition(session)}`, Object.values(session), devMode || this.devMode);
		return [res != undefined, res != undefined ? `Something went wrong.\n${res}` : undefined];
	}
}
