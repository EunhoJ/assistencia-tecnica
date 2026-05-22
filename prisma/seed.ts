// Seed inicial — roda apenas em dev via `prisma db seed`.
// Vercel NÃO executa este script no build (apenas `prisma migrate deploy`).
// Idempotente: rodar N vezes sempre deixa Config{id:1, limiar_dias_parados:30}.

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurado");
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  await prisma.config.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, limiarDiasParados: 30 },
  });

  console.log("[seed] config inicial garantido (id=1, limiar_dias_parados=30)");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seed] erro:", err);
  process.exit(1);
});
