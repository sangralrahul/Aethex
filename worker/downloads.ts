// downloads.aethex.in/cadus/<version>/<file>: the Cadus desktop installers,
// streamed from the R2 bucket "aethex-downloads" (binding DOWNLOADS).
// Supports HEAD, resumable downloads (Range) and If-None-Match.

/** The parts of the R2 binding used here. */
export interface R2Object {
  key: string;
  size: number;
  httpEtag: string;
  uploaded: Date;
  range?: { offset?: number; length?: number; suffix?: number };
  writeHttpMetadata(headers: Headers): void;
}
export interface R2ObjectBody extends R2Object { body: ReadableStream }
export interface R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(key: string, options?: { range?: Headers; onlyIf?: Headers }): Promise<R2ObjectBody | R2Object | null>;
}

/** Only release files: cadus/1.2.3/Name.ext, nothing else in the bucket. */
const KEY = /^cadus\/\d+\.\d+\.\d+\/[A-Za-z0-9._-]+$/;

const text = (status: number, body: string, extra: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...extra } });

export async function serveDownload(request: Request, bucket: R2Bucket | undefined, key: string): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return text(405, "Use GET", { allow: "GET, HEAD" });
  if (!KEY.test(key) || key.includes("..")) return text(404, "Not found. The Cadus downloads are at https://downloads.aethex.in/");
  if (!bucket) return text(503, "Downloads are not configured (R2 binding DOWNLOADS is missing).");

  const obj = request.method === "HEAD"
    ? await bucket.head(key)
    : await bucket.get(key, { range: request.headers, onlyIf: request.headers });
  if (!obj) return text(404, "Not found. The Cadus downloads are at https://downloads.aethex.in/");

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("accept-ranges", "bytes");
  // Each version has its own folder, so a file never changes once published.
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  if (!headers.has("content-type")) headers.set("content-type", "application/octet-stream");

  // If-None-Match matched (R2 returns the object without a body).
  if (request.method === "GET" && !("body" in obj)) return new Response(null, { status: 304, headers });

  if (request.method === "HEAD") {
    headers.set("content-length", String(obj.size));
    return new Response(null, { status: 200, headers });
  }

  const r = obj.range;
  if (request.headers.has("range") && r) {
    const offset = r.suffix !== undefined ? obj.size - r.suffix : r.offset ?? 0;
    const length = r.suffix !== undefined ? r.suffix : r.length ?? obj.size - offset;
    headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    headers.set("content-length", String(length));
    return new Response((obj as R2ObjectBody).body, { status: 206, headers });
  }
  headers.set("content-length", String(obj.size));
  return new Response((obj as R2ObjectBody).body, { status: 200, headers });
}
