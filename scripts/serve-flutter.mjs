#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { createGzip } from "node:zlib";

const root = process.argv[2] || "/workspace/apps/flutter/build/web";
const port = Number(process.env.PORT || 8080);
const api = process.env.API_ORIGIN || "http://127.0.0.1:8090";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const gzipExt = new Set([".html", ".js", ".mjs", ".css", ".json", ".svg", ".wasm"]);
const proxyPrefixes = ["/api", "/audio", "/covers", "/artists", "/banners", "/events"];

function shouldProxy(url) {
  return proxyPrefixes.some((p) => url === p || url.startsWith(p + "/") || url.startsWith(p + "?"));
}

createServer(async (req, res) => {
  const raw = req.url || "/";
  const pathOnly = decodeURIComponent(raw.split("?")[0]);
  if (shouldProxy(pathOnly)) {
    try {
      const up = await fetch(api + raw, {
        method: req.method,
        headers: { ...req.headers, host: undefined },
        body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
        duplex: "half",
      });
      res.statusCode = up.status;
      up.headers.forEach((v, k) => {
        if (k === "transfer-encoding") return;
        res.setHeader(k, v);
      });
      const buf = Buffer.from(await up.arrayBuffer());
      res.end(buf);
    } catch (e) {
      res.statusCode = 502;
      res.end(String(e));
    }
    return;
  }
  let rel = pathOnly === "/" ? "/index.html" : pathOnly;
  let file = join(root, normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, "index.html");
  const ext = extname(file).toLowerCase();
  res.setHeader("Content-Type", types[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Permissions-Policy", "autoplay=*, fullscreen=*, picture-in-picture=*");
  const gzip = gzipExt.has(ext) && (req.headers["accept-encoding"] || "").includes("gzip");
  if (gzip) {
    res.setHeader("Content-Encoding", "gzip");
    createReadStream(file).pipe(createGzip({ level: 6 })).pipe(res);
  } else {
    createReadStream(file).pipe(res);
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`flutter web ${root} → 0.0.0.0:${port} (api ${api})`);
});
