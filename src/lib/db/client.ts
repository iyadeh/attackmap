import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type DatabaseClient = ReturnType<typeof postgres>;

let databaseClient: DatabaseClient | null = null;
let database: ReturnType<typeof createDatabase> | null = null;

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
  }

  databaseClient = postgres(databaseUrl);

  return drizzle(databaseClient, { schema });
}

export function getDatabase() {
  database ??= createDatabase();

  return database;
}

export async function closeDatabase() {
  if (!databaseClient) {
    return;
  }

  await databaseClient.end();
  databaseClient = null;
  database = null;
}
