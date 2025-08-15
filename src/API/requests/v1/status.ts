import { API_Methods } from "../../../shared/schemas/api.d.ts";
import { permissionsMap } from "../../../shared/schemas/misc.ts";
import { misc } from "../../../shared/utils/config.ts";

export default {
	method: ["GET"],
	version: 1,
	route: "server/status",

	exec: (): { status: number; message: string; data: unknown } => {
		return {
			status: 200,
			message: `Server is running`,
			data: JSON.stringify({
				version: misc.config.version.toString(),
				changelog: misc.config.changelog[0], // Latest changelog
			}),
		};
	},
	// deno-lint-ignore no-explicit-any
} as { method: Array<API_Methods>; route: keyof typeof permissionsMap; version: number; exec: () => Promise<{ status: number; message: string; data: any }> | { status: number; message: string; data: any } };
