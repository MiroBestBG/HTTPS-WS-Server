import { API_Methods, API_Request_Files, ConnectionInfo } from "../../../../shared/schemas/api.d.ts";
import { hasPermission, permissionsMap } from "../../../../shared/schemas/misc.ts";
import { API_Stages, Session, SessionCreateArgs, Sessions, SessionScopes } from "../../../../shared/utils/api.ts";
import { misc } from "../../../../shared/utils/config.ts";
import { Utilities } from "../../../../shared/utils/utils.ts";

const data_blueprint = {
	devMode: false,
	referrer: "",
	allowedMethods: [],
	allowedStages: [],
	description: "",
	expiresAt: "",
	title: "",
};
export default {
	method: ["PUT"],
	version: 1,
	route: "session/create",

	exec: async (session: Session, data: Record<string, unknown>): Promise<{ status: number; message: string; data: unknown }> => {
		hasPermission(session, "session/create");
		if (!session.scopes.global[permissionsMap["session/create"]]) return { status: 403, message: `❌ | You must have the \`${permissionsMap["session/create"]}\` permission to run this`, data: null };

		const missingKeys = Object.keys(data_blueprint).filter((key) => !(key in data));

		if (missingKeys.length > 0) {
			return { status: 400, message: `Data is missing the following:\n ${missingKeys.join("\n")}`, data: missingKeys };
		}
		const [res, err] = await new Sessions(data.devMode as boolean).create({
			allowedMethods: data.allowedMethods as any,
			allowedStages: data.allowedStages as Array<(typeof API_Stages)[keyof typeof API_Stages]>,
			createdBy: JSON.stringify({ referrer: data.referrer, key: session.key }),
			description: data.description as string,
			expiresAt: data.expiresAt as number,
			scopes: data.scopes as SessionScopes,
			title: data.title as string,
		});

		Utilities.debugLog("DEBUG", `Created a session${err != undefined ? `\nerr: ${err}` : ""}`, { fileDir: import.meta.filename });

		if (!err) return { status: 200, message: `✅ | Created a session`, data: res };
		return { status: 500, message: `❌ | Couldn't create a session`, data: res };
	},
	// deno-lint-ignore no-explicit-any
} as { method: Array<API_Methods>; route: keyof typeof permissionsMap; version: number; exec: () => Promise<{ status: number; message: string; data: any }> | { status: number; message: string; data: any } };
