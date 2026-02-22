import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import passport from "passport";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Log DB config at startup (password redacted) so we can verify what the process sees
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith("mysql")) {
    try {
      const u = new URL(dbUrl);
      const redacted = `mysql://${u.username}:***@${u.hostname}:${u.port || 3306}${u.pathname}`;
      log(`DATABASE_URL seen: ${redacted}`);
    } catch {
      log("DATABASE_URL set but invalid URL");
    }
  } else {
    log("DATABASE_URL not set or not mysql (cwd=" + process.cwd() + ")");
  }

  const { setupSession } = await import("./session");
  const { configurePassport } = await import("./auth");
  await setupSession(app);
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5020 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5020", 10);
  const listenOptions: Parameters<typeof httpServer.listen>[0] = {
    port,
    host: "0.0.0.0",
  };

  // `reusePort` is not supported on Windows.
  if (process.platform !== "win32") {
    (listenOptions as any).reusePort = true;
  }

  httpServer.listen(
    listenOptions,
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
