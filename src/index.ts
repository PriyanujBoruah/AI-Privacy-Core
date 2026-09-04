import { Hono } from "hono";
import { cors } from "hono/cors";
import tokenizationApp from "./routes/tokenization";

const app = new Hono();

// Enable CORS for all routes so browsers, local files, and documentation playgrounds can connect
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-detection-categories",
      "x-categories",
      "x-custom-entities",
      "x-custom-keywords",
    ],
    exposeHeaders: ["Content-Length", "X-Kms-Status"],
    maxAge: 86400,
  })
);

app.options("*", (c) => c.text("", 204));

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
