/**
 * Answer rendering for the Cadus thread: a memoised markdown block (so long
 * chats don't re-render every answer) and the live, streaming answer, which
 * subscribes to its own small store so only it updates as text arrives.
 */
import { memo, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { renderMarkdown } from "@/lib/cadus-markdown";
import { closePartialMarkdown } from "@/lib/cadus/stream";

export interface TextStore {
  get: () => string;
  subscribe: (l: () => void) => () => void;
}

export const MdBlock = memo(function MdBlock({ text, cites, className = "" }: { text: string; cites?: number; className?: string }) {
  return <div className={`cx-md ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(text, { cites, copy: true }) }} />;
});

/** Puts a blinking caret at the end of the last block of streamed text. */
function withCaret(html: string): string {
  const re = /<\/(p|li|h[2-4]|td|th|blockquote)>(?![\s\S]*<\/(?:p|li|h[2-4]|td|th|blockquote)>)/;
  return re.test(html) ? html.replace(re, '<span class="cx-caret"></span></$1>') : `${html}<span class="cx-caret"></span>`;
}

/**
 * The answer as it streams in. `writing` adds the caret; otherwise the text is the
 * finished draft, shown while the safety review runs. Shows `placeholder` until text arrives.
 */
export function LiveAnswer({ store, writing, onGrow, placeholder = null }: {
  store: TextStore;
  writing: boolean;
  onGrow?: () => void;
  placeholder?: ReactNode;
}) {
  const text = useSyncExternalStore(store.subscribe, store.get, store.get);
  useEffect(() => {
    onGrow?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  if (!text) return <>{placeholder}</>;
  const html = renderMarkdown(writing ? closePartialMarkdown(text) : text, { copy: false });
  return <div className={`cx-md cx-live ${writing ? "" : "is-draft"}`} dangerouslySetInnerHTML={{ __html: writing ? withCaret(html) : html }} />;
}

/** Whether the live store has any text yet (for switching from the "thinking" view). */
export function useHasText(store: TextStore): boolean {
  return useSyncExternalStore(store.subscribe, () => store.get().length > 0, () => store.get().length > 0);
}
