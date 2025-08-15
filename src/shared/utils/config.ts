import { DIR } from "../schemas/misc.ts";
import { CONFIG_FILE } from "../schemas/api.d.ts";

export const misc = {
	config: JSON.parse(Deno.readTextFileSync(`${DIR.DB}/config.json`)) as CONFIG_FILE,
	certs: {
		CA: Deno.readTextFileSync(`${DIR.SHARED.SHARED_SCHEMA}/cert.pem`) ?? "",
		KEY: Deno.readTextFileSync(`${DIR.DB}/key.pem`) ?? "",
	},
};
