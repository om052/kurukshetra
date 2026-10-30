import { createApp, env } from "./app.js";
import { connectDb, disconnectDb } from "./db.js";

const app = createApp();

async function main() {
  try {
    await connectDb();
    console.log("MongoDB connected");
  } catch (e) {
    console.error("MongoDB connection failed:", e);
  }
  const server = app.listen(env.PORT, () => console.log(`Server on ${env.PORT}`));
  const shutdown = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();