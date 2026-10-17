/**
 * Answer rendering for the Cadus thread: a memoised markdown block (so long
 * chats don't re-render every answer) and the live, streaming answer, which
 * subscribes to its own small store so only it updates as text arrives.
 */
import { memo, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import { renderMarkdown } from "@/lib/cadus-markdown";
import { closePartialMarkdown } from "@/lib/cadus/stream";
import { useFlowcharts } from "@/lib/cadus/flowchart";
import { answerOutline, liftKeyPoints } from "@/lib/cadus/reference";

export interface TextStore {
  get: () => string;
  subscribe: (l: () => void) => () => void;
}

export const MdBlock = memo(function MdBlock({ text, cites, className = "", outline = false }: { text: string; cites?: number; className?: string; outline?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Long answers (four or more sections) get an outline that jumps to each one.
  const sections = useMemo(() => (outline ? answerOutline(text) : []), [outline, text]);
  const jump = (i: number) => {
    const el = ref.current?.querySelectorAll<HTMLElement>("h3")[i];
    const box = el?.closest<HTMLElement>(".cx-view");
    if (!el || !box) return;
    box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 72, behavior: "smooth" });
  };
  // The answer's key points sit under its bottom line, as a card.
  const html = useMemo(() => renderMarkdown(liftKeyPoints(text), { cites, copy: true }), [text, cites]);
  // The same object between renders, so React 19 doesn't reset the HTML and wipe drawn flowcharts.
  const inner = useMemo(() => ({ __html: html }), [html]);
  // Flowcharts are drawn once the answer is on screen.
  useFlowcharts(ref, `${html}|${className}`);
  const body = <div ref={ref} className={`cx-md ${className}`} dangerouslySetInnerHTML={inner} />;
  if (sections.length < 4) return body;
  return (
    <>
      <nav className="cx-outline" aria-label="Sections of this answer">
        <span>In this answer</span>
        {sections.map((t, i) => <button key={`${i}-${t}`} type="button" onClick={() => jump(i)}>{t}</button>)}
      </nav>
      {body}
    </>
  );
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
