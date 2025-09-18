console.clear();
import { CONFIG_FILE, API_Request_Files } from "../shared/schemas/api.ts";
import { DIR, CallbackCode, getDescriptionByCode, debugType } from "../shared/schemas/misc.ts";
import { walk } from "https://deno.land/std/fs/walk.ts";
import { misc } from "../shared/utils/config.ts";
import { JsonWebTokenError, JwtPayload, TokenExpiredError, verify } from "npm:jsonwebtoken";
import { Buffer } from "node:buffer";
import { Session, Sessions, SessionStatus } from "../shared/utils/api.ts";
import { isValidRuntimeDirectory, Utilities } from "../shared/utils/utils.ts";

console.log(DIR);
if (!isValidRuntimeDirectory()) throw new Error("Invalid Runtime Directory");
function verifyJWT(token: string, secret?: string) {
	try {
		// Will throw if malformed, expired, or signature invalid
		return verify(token, secret ?? Buffer.from(misc.config.apiToken, "base64"));
	} catch (error) {
		if (error instanceof TokenExpiredError) {
			throw new Error("JWT expired");
		} else if (error instanceof JsonWebTokenError) {
			console.error("JWT error:", error.message); // e.g. "jwt malformed", "invalid signature"
			throw new Error("Malformed or invalid JWT");
		} else {
			throw error; // rethrow unexpected errors
		}
	}
}

export class API {
	private WSsessions: Array<{ key: string; info: Session; socket: WebSocket }> = [];
	private API_sessions: Array<Session> = [];
	private readonly config: CONFIG_FILE;
	private controller: AbortController | null = null;
	private server: Deno.HttpServer | null = null;
	private API_Responses: API_Request_Files[] = [];

	constructor(config: CONFIG_FILE) {
		this.config = config;
		this.handler = this.handler.bind(this);
		this.API_responsesInit();
	}

	private async API_responsesInit() {
		for await (const entry of walk(DIR.API.REQUESTS, { includeFiles: true, includeDirs: false, exts: ["ts"] })) {
			const { method, route, exec, version } = (await import(entry.path)).default;
			this.API_Responses.push({ method, route, exec, version });
		}
	}

	private throwError(code: number, message?: string) {
		return JSON.stringify({
			type: "error",
			code,
			message: message || getDescriptionByCode(code),
		});
	}

	private async handler(req: Request): Promise<Response> {
		if (api.API_Responses.length === 0) await api.API_responsesInit();

		// ------------------- WEBSOCKET -------------------
		try {
			if (req.headers.get("upgrade") === "websocket") {
				const { socket, response } = Deno.upgradeWebSocket(req);
				const url = new URL(req.url);

				socket.addEventListener("open", async () => {
					// Version check
					if (url.searchParams.get("version")?.toString() != misc.config.version.toString()) {
						socket.send(this.throwError(CallbackCode.WEBSOCKET_CONNECTION_VERSION_MISMATCH));
						return socket.close(400, "Invalid version");
					}

					const jwtKey = url.searchParams.get("token")?.toString() as string;
					if (!jwtKey) {
						socket.send(this.throwError(CallbackCode.WEBSOCKET_CONNECTION_TOKEN_INVALID));
						return socket.close(403, "Invalid token");
					}

					let sessionData;
					try {
						sessionData = verifyJWT(jwtKey) as JwtPayload;
					} catch (_err) {
						socket.send(this.throwError(CallbackCode.WEBSOCKET_CONNECTION_TOKEN_INVALID));
						return socket.close(403, "Invalid token");
					}
					const session = await new Sessions().get({ key: sessionData.key });

					// JWT Token Exists & Is valid?
					if (!session) {
						socket.send(this.throwError(CallbackCode.WEBSOCKET_CONNECTION_TOKEN_INVALID));
						return socket.close(403, "Invalid token");
					}

					if (session?.status != SessionStatus.ACTIVE) {
						socket.send(this.throwError(CallbackCode.WEBSOCKET_CONNECTION_SESSION_NOT_ACTIVE));
						return socket.close(401, "Token has been revoked, deleted or expired");
					}
					// JWT Token is expired
					if (session.expiresAt < Date.now() / 1000) {
						socket.send(this.throwError(CallbackCode.WEBSOCKET_CONNECTION_TOKEN_EXPIRED));
						return socket.close(403, "Token expired");
					}

					// JWT Token is up to date:
					if (session.jwtKey !== jwtKey) {
						socket.send(this.throwError(CallbackCode.WEBSOCKET_CONNECTION_TOKEN_OUT_OF_SYNC));
						return socket.close(403, "Token out of sync");
					}

					this.WSsessions.push({
						key: jwtKey,
						info: session,
						socket,
					});

					socket.send(JSON.stringify({ type: "event", code: CallbackCode.WEBSOCKET_CONNECTION_SESSION_ESTABLISHED, message: `Session established` }));
					return;
				});

				socket.addEventListener("message", (event) => {
					this.handleWebSocketMessage(socket, event.data);
				});

				socket.addEventListener("close", () => {
					this.WSsessions = this.WSsessions.filter((s) => s.socket !== socket);
				});

				return response;
			}
		} catch (e) {
			console.log(e);
		}
		try {
			// ------------------- REST API -------------------
			const URL_Details = new URL(req.url);
			const { method, route, auth, version } = { method: req.method as unknown as API_Request_Files["method"], route: URL_Details.pathname.slice(1, URL_Details.pathname.length), auth: URL_Details.searchParams.get("auth"), version: URL_Details.searchParams.get("version") };
			let data;
			try {
				data = await req.json();
				// deno-lint-ignore no-empty
			} catch (_err) {}
			if (!auth) {
				return new Response(this.throwError(401, "Unauthorized"), { status: 401 });
			}

			try {
				let sessionData;
				try {
					sessionData = verifyJWT(auth) as JwtPayload;
				} catch (_err) {
					console.info(_err);
					return new Response(this.throwError(401, "Unauthorized"), { status: 401 });
				}

				const session = await new Sessions().get({ key: sessionData.key });
				if (!session) return new Response(this.throwError(401, "Unauthorized"), { status: 401 });

				// JWT Token Exists
				if (!session) return new Response(this.throwError(401, "Unauthorized"), { status: 401 }); // JWT Session exists
				if (session?.status != SessionStatus.ACTIVE) return new Response(this.throwError(403, "Unauthorized"), { status: 403, statusText: `Token is not activated.` }); // JWT Token isn't active
				if (session.expiresAt < Date.now() / 1000) return new Response(this.throwError(403, "Unauthorized"), { status: 403, statusText: `Token has expired.` }); // JWT Token is expired
				if (session.jwtKey !== auth) return new Response(this.throwError(403, "Unauthorized"), { status: 403, statusText: "Token is out of sync. Please re-authenticate." }); // JWT Token is altered (mismatch)

				const routesFound = this.API_Responses.find((a) => a.method == method && a.route == route && a.version == version);
				if (!routesFound) return new Response(this.throwError(404, "Route not found"), { status: 404 });

				const res = (await routesFound.exec(session, data)) as unknown as { status: number; message: string; data?: BodyInit };
				return new Response(JSON.stringify(res?.data), {
					status: res?.status,
					// deno-lint-ignore no-control-regex
					statusText: String(res?.message ?? "OK").replace(/[^\x00-\x7F]/g, ""), // Remove non-ascii characters (unsupported by Deno)
				});
			} catch (err) {
				console.info(err);
				return new Response(this.throwError(500, "Internal Server Error. Couldn't get/authenticate session."), { status: 500 });
			}
		} catch (error) {
			console.error(error);
			return new Response(this.throwError(500, "Internal Server Error. Ensure you have provided all required arguments."), { status: 500 });
		}
	}

	private async handleWebSocketMessage(socket: WebSocket, message: string) {
		try {
			const { method, route, data, auth, version } = JSON.parse(message);
			if (!method || !route || !version) {
				console.warn("Non-API message received:", message);
				return;
			}
			if (!auth) {
				return socket.send(JSON.stringify({ error: "Unauthorized" }));
			}
			if (!method || !route || !version) return socket.send(JSON.stringify({ error: "Bad request", code: 400 }));

			const session = this.WSsessions.find((s) => s.key === auth);
			if (!session) return socket.send(JSON.stringify({ error: "Unauthorized", code: 401 }));

			// /* Find file */
			if (this.API_Responses.length === 0) await this.API_responsesInit();
			const routesFound = this.API_Responses.filter((a) => a.method == method && a.route == route);

			if (routesFound.length === 0) {
				socket.send(this.throwError(400, "Route not found"));
			} else {
				const res = await routesFound[0].exec(session.info, data);

				socket.send(JSON.stringify(res));
			}
		} catch (err) {
			console.info(err);
			socket.send(JSON.stringify({ error: "Invalid token or request" }));
		}
	}

	private API_onListen(args: { hostname: string; port: number }) {
		Utilities.debugLog(debugType.WARN, `Listening on ${args.hostname}:${args.port}`, { fileDir: import.meta.filename });
	}

	private API_onError(args: unknown): Response {
		console.info(args);
		return new Response(this.throwError(500, "Internal Server Error"), { status: 500 });
	}

	public start() {
		this.server = Deno.serve(
			{
				port: this.config.server.port,
				onListen: this.API_onListen,
				onError: (err) => this.API_onError(err),
				cert: misc.certs.CA,
				key: misc.certs.KEY,
			},
			this.handler
		);
		this.controller = new AbortController();
	}
}

const api = new API(await JSON.parse(Deno.readTextFileSync(`${DIR.DB}/config.json`)));
if (isValidRuntimeDirectory()) api.start();
