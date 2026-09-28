import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "vfo_user",
    password: process.env.MYSQL_PASSWORD ?? "VfoPass2026!",
    database: process.env.MYSQL_DATABASE ?? "voyage_flow_ops",
  },
});
