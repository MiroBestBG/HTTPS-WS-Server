import { dbFilenames, tableNames } from "../shared/schemas/sql.ts";
import { API_Stages, Sessions } from "../shared/utils/api.ts";
import { misc } from "../shared/utils/config.ts";
import { SQL } from "../shared/utils/sql.ts";

const a = new Sessions();
a.patch({ id: 25 }, { allowedMethods: ["DELETE", "GET", "PATCH"] });
// console.clear();
// const token =
// 	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGF0dXMiOiJBQ1RJVkUiLCJjcmVhdGVkQnkiOiJ7XCJyZWZlcnJlclwiOlwiQWJyb2FkXCIsXCJrZXlcIjpcIjdGN1FyWGZndUZHUFd2Um9lTzhaMmZtUU5FQ0NqRTlSM3lZVmxZOVJOejQ9XCJ9IiwidGl0bGUiOiJUZXN0IiwiZGVzY3JpcHRpb24iOiJIZWxsbyB3b3JsZCEiLCJrZXkiOiJkcEJ5Y3RSMHp2NW9IaGVWRjdXbWkzbWpJZGZ6ZlZjbXJYZEZoT01HcklZPSIsImp3dEtleSI6IiIsInNjb3BlcyI6IntcImdsb2JhbFwiOntcInNlc3Npb246ZGVsZXRlXCI6MjcyNzI3NzI3LFwic2Vzc2lvbjpjcmVhdGVcIjoyNzI3Mjc3Mjd9fSIsImFsbG93ZWRNZXRob2RzIjoiW1wiUFVUXCJdIiwiYWxsb3dlZFN0YWdlcyI6IltcIlBST0RVQ1RJT05cIl0iLCJjcmVhdGVkQXQiOjE3NTUwNzc0OTAsImV4cGlyZXNBdCI6MjUyNDYwODAwMCwiaWF0IjoxNzU1MDc3NDkwLCJleHAiOjQyNzk2ODU0OTB9.S1NLxNVUfRvT6A1h7TYEi2RcdQlCwhYq-x0w3cKn5b0";
// const url = `https://0.0.0.0:${misc.config.server.port}/session/create?version=${misc.config.version}&auth=${token}`;
// let data = await fetch(url, {
// 	method: "PUT",
// 	body: JSON.stringify({
// 		devMode: false,
// 		allowedMethods: ["PUT", "PATCH", "DELETE"],
// 		scopes: {
// 			global: {
// 				"session:delete": 2755090566,
// 				"session:create": 2755090566,
// 			},
// 		},
// 		allowedStages: [API_Stages.DEVELOPMENT],
// 		createdBy: `Miro`,
// 		referrer: `Abroad`,
// 		expiresAt: 2755090566,
// 		title: `Session Test Env (Suspended)`,
// 		description: `Hello world!`,
// 	}),
// });
// console.info(data);
