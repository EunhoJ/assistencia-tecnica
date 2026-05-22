import "dotenv/config";
import { defineConfig } from "prisma/config";

// Lê DIRECT_URL diretamente do process.env (em vez de `env()` do Prisma) para
// não estourar quando a variável estiver ausente — comandos como
// `prisma format`, `prisma validate` e `prisma generate` não precisam de URL.
// Migrations (`prisma migrate dev|deploy`) falham depois com mensagem clara
// se a URL estiver vazia, o que é o comportamento desejado.
const directUrl = process.env.DIRECT_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
  },
});
