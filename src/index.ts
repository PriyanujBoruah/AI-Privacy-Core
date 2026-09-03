import { Hono } from "hono";
import tokenizationApp from "./routes/tokenization";

const app = new Hono();

// Mount Data De-identification & Reversible Tokenization Engine on /v1
app.route("/v1", tokenizationApp);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "2.0.0",
  });
});

app.get("/", (c) => {
  return c.text("Data De-identification & Reversible Tokenization Engine is active.");
});

export default app;
