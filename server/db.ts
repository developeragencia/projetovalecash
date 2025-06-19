import { neon, Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

dotenv.config();

// process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://valecashback_user:gsBwq6Lm6#TsDYVbq8Bp@31.97.161.159:5432/valecashback-db-production?sslmode=disable";
neonConfig.webSocketConstructor = ws;
console.log("process.env.DATABASE_URL ", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"+ process.env.DATABASE_URL,
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // Reduzindo o número máximo de conexões
  idleTimeoutMillis: 30000, // Aumentando o tempo limite de inatividade
  connectionTimeoutMillis: 10000 // Aumentando o tempo limite de conexão
});
export const db = drizzle({ client: pool, schema });