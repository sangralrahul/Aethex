// Lets the Supabase Edge Function code in supabase/functions run unchanged on
// Cloudflare Workers: Deno.env.get reads the Worker's variables and secrets,
// and Deno.serve registers each function's handler under the name set just
// before it is imported (see worker/names and worker/index.ts).
type Handler = (req: Request) => Response | Promise<Response>;

const handlers = new Map<string, Handler>();
let pendingName = "";
let vars: Record<string, unknown> = {};

(globalThis as unknown as { Deno: unknown }).Deno = {
  env: {
    get: (key: string): string | undefined => {
      const v = vars[key];
      return typeof v === "string" && v ? v : undefined;
    },
  },
  serve: (handler: Handler) => {
    if (pendingName) handlers.set(pendingName, handler);
    pendingName = "";
  },
};

/** Called by worker/names/*: the next Deno.serve() belongs to this function. */
export function nameNextFunction(name: string): void {
  pendingName = name;
}

/** Make the Worker's variables and secrets visible to Deno.env.get. */
export function useEnv(env: Record<string, unknown>): void {
  vars = env;
}

export function functionHandler(name: string): Handler | undefined {
  return handlers.get(name);
}

export function functionNames(): string[] {
  return [...handlers.keys()];
}
