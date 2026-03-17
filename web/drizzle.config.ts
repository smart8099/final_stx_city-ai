import type { Config } from "drizzle-kit";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv") as typeof import("dotenv");
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default {
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://cityassist:cityassist@localhost:5432/cityassist",
  },
} satisfies Config;
