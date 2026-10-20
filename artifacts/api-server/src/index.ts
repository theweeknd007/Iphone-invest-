import { createServer } from "node:http";
import "dotenv/config";
import app from "./app";
import { initDatabase } from "./apple-invest/server/db";
import { setupChatWebSocket } from "./apple-invest/server/chatServer";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

initDatabase();
const server = createServer(app);
setupChatWebSocket(server);

server.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
