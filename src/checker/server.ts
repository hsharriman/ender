import { createServer, IncomingMessage, ServerResponse } from "http";
import {
  collectProofCheckerErrors,
  runProofCheckerFromText,
} from "./proofChecker";
import { ErrorType } from "./errors/errorConstants";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  if (req.method === "POST" && req.url === "/check") {
    try {
      const body = await readBody(req);
      const { text } = JSON.parse(body) as { text: string };
      if (typeof text !== "string") {
        json(res, 400, { error: 'Body must contain a "text" string field' });
        return;
      }
      const result = runProofCheckerFromText(text);
      if (result.errors.length > 0) {
        json(res, 200, { isCorrect: false, errors: result.errors });
      } else {
        json(res, 200, {
          isCorrect: result.proof.isCorrect,
          issues: collectProofCheckerErrors(result),
        });
      }
    } catch (e) {
      json(res, 500, {
        isCorrect: false,
        errors: [
          {
            type: ErrorType.UnclassifiedError,
            code: "unexpected_error",
            details: { msg: e instanceof Error ? e.message : String(e) },
          },
        ],
      });
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
}).listen(PORT, () => {
  console.log(`Checker server listening on port ${PORT}`);
});
