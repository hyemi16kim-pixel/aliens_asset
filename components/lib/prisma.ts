import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                      // Neon 무료 티어 연결 수 제한
  idleTimeoutMillis: 10_000,   // 유휴 연결 10초 후 해제
  connectionTimeoutMillis: 5_000, // 연결 실패 시 5초 내 에러
});

const adapter = new PrismaPg(pool);
