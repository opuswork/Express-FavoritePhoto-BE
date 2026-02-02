// Express-Favorite-BE/src/server.js

import "dotenv/config";
import app from "./app.js";
import { prisma } from "./db/prisma.js";

async function start() {
  const port = process.env.PORT ?? 3000;

  try {
    await prisma.$connect();
    console.log("DB 연결 성공");

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("DB 연결 실패", err);
    process.exit(1);
  }
}

start();

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
