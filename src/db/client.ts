import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Connection pool — reused across server function calls
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "vfo_user",
  password: process.env.MYSQL_PASSWORD ?? "VfoPass2026!",
  database: process.env.MYSQL_DATABASE ?? "voyage_flow_ops",
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
