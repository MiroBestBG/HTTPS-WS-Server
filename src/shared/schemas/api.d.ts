import { Session } from "../utils/api.ts";

export interface ConnectionInfo {
	key: string;
	token: string;
	title: string;
	socket: WebSocket;
}

export interface CONFIG_FILE {
	version: string;
	apiToken: string;
	changelog: Array<string[]>;
	server: {
		port: number;
		connections: Array<{
			token: string;
			title: string;
			description: string;
			createdBy: string;
		}>;
	};
}
export type API_Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type API_Stages = "DEV" | "PRE_PROD" | "PRODUCTION";
export interface API_Request_Files {
	method: Array<API_Methods>;
	route: string;
	version: string;
	exec: (session: Session, body: unknown) => Promise<Response>;
}
export interface CallbackCode {
	code: number;
	text: string;
	description: string;
}
