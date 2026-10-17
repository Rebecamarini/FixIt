import { existsSync } from "node:fs";
import { checkConnection } from "../src/server/connection.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const result = await checkConnection();
console.log(result.message);
process.exitCode = result.status === "connected" ? 0 : 1;
