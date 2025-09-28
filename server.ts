/// <reference lib="deno.ns" />

import {
  serveDir,
  serveFile,
} from "https://deno.land/std@0.224.0/http/file_server.ts";
import { extname } from "https://deno.land/std@0.224.0/path/mod.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (extname(pathname)) {
    return serveDir(req, { fsRoot: "dist" });
  }

  const dirResp = await serveDir(req, { fsRoot: "dist" });
  if (dirResp.status !== 404) return dirResp;

  return serveFile(req, "dist/index.html");
});
