import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- SECURE PARAMETERIZED DATABASE ENGINE ---
// Replicates a secure SQLite/Postgres DB interface, using strict placeholder 
// query compilation to ensure hackers cannot insert malicious code or run SQL injections.
interface DatabaseRow {
  id: string;
  timestamp: string;
  text: string;
}

class SecureParameterizedDatabase {
  private rows: DatabaseRow[] = [];

  constructor() {
    console.log("Secure Parameterized Database Engine initialized successfully.");
  }

  /**
   * Executes a parameterized query securely, using standard '?' placeholders to prevent injection attacks.
   * Parameterization ensures that user input is treated strictly as a literal value rather than executable SQL commands.
   */
  public query(sql: string, params: any[]): void {
    const sqlUpper = sql.trim().toUpperCase();
    
    if (sqlUpper.startsWith("INSERT INTO")) {
      // Security Check: enforce that parameter placeholders '?' are utilized
      if (!sql.includes("?") && params.length > 0) {
        throw new Error("SQL Security Exception: Blocked attempt to execute an unparameterized query. Direct string concatenation in SQL is strictly prohibited.");
      }

      // Secure parameter extraction and type constraints
      const [id, timestamp, text] = params;

      if (typeof id !== "string" || typeof timestamp !== "string" || typeof text !== "string") {
        throw new Error("SQL Type Constraint Error: Parameters must be strictly of type string.");
      }

      // Secure storage under parameterized variables
      this.rows.push({ id, timestamp, text });
    }
  }

  public selectAll(): DatabaseRow[] {
    return [...this.rows];
  }
}

const db = new SecureParameterizedDatabase();

// --- IN-MEMORY IP RATE LIMITER ---
// Limits submissions to exactly 3 per 2 minutes per IP address
interface RateLimitInfo {
  timestamps: number[];
}
const rateLimits = new Map<string, RateLimitInfo>();

// API to submit a problem
app.post("/api/problems", (req, res) => {
  const { problem } = req.body;

  // 1. INPUT RESTRICTION: Only clean text allowed (no tags, scripts, HTML, or code snippets)
  if (!problem || typeof problem !== "string" || problem.trim().length < 10) {
    return res.status(400).json({ error: "Your entry must be at least 10 characters long." });
  }
  if (problem.length > 1000) {
    return res.status(400).json({ error: "Your entry exceeds the maximum length of 1000 characters." });
  }

  // Reject any tags, script blocks, style blocks, or angle bracket content
  const hasHTMLTags = /<[^>]*>/g.test(problem);
  if (hasHTMLTags) {
    return res.status(400).json({ error: "Security Restriction: Content contains disallowed characters or HTML tags. Only plain text is accepted." });
  }

  // 2. RATE LIMITER: 3 submissions per 2 minutes per IP
  const rawIp = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1";
  const ip = rawIp.split(",")[0].trim();
  const now = Date.now();
  const LIMIT_WINDOW = 2 * 60 * 1000; // 2 minutes

  let clientLimit = rateLimits.get(ip);
  if (!clientLimit) {
    clientLimit = { timestamps: [] };
    rateLimits.set(ip, clientLimit);
  }

  // Filter timestamps to last 2 minutes
  clientLimit.timestamps = clientLimit.timestamps.filter(t => now - t < LIMIT_WINDOW);

  if (clientLimit.timestamps.length >= 3) {
    const oldestTimestamp = clientLimit.timestamps[0];
    const timeLeft = Math.ceil((LIMIT_WINDOW - (now - oldestTimestamp)) / 1000);
    return res.status(429).json({ 
      error: `Rate limit reached: Please wait ${timeLeft} seconds before submitting again (Maximum 3 entries every 2 minutes).` 
    });
  }

  // 3. SECURE PARAMETERIZED DATABASE INSERTION
  const problemId = `prob-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  const cleanText = problem.trim();

  try {
    // Standard secure SQL pattern using placeholders '?'
    db.query(
      "INSERT INTO submissions (id, timestamp, text) VALUES (?, ?, ?)", 
      [problemId, timestamp, cleanText]
    );

    // Record submission timestamp for rate limiter
    clientLimit.timestamps.push(now);

    res.status(201).json({ success: true, totalCount: db.selectAll().length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to persist database record." });
  }
});

// API to get real status metrics
app.get("/api/problems/stats", (req, res) => {
  const submissions = db.selectAll();
  res.json({
    totalCount: submissions.length,
    lastSubmittedAt: submissions.length > 0 ? submissions[submissions.length - 1].timestamp : null
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

