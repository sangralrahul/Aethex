/**
 * Attachments for a Cadus question: images (X-rays, ECGs, photos of reports),
 * PDFs (lab reports, discharge summaries, papers) and text files. PDFs are read
 * by the AI directly, including scanned pages.
 */

export type AttachKind = "image" | "pdf" | "text";

export interface Attachment {
  id: string;
  kind: AttachKind;
  name: string;
  /** Size of the original file in bytes. */
  size: number;
  /** PDF page count, when it could be read. */
  pages?: number;
  /** Data URL for images and PDFs; the text itself for text files. Dropped from saved history for PDFs. */
  data?: string;
}

export const ATTACH_LIMITS = {
  images: 5,
  pdfs: 3,
  texts: 3,
  /** Per PDF, in bytes. */
  pdfBytes: 15 * 1024 * 1024,
  /** Per text file, in characters. */
  textChars: 100_000,
  /** All attachments on one message, in bytes. */
  totalBytes: 25 * 1024 * 1024,
};

export const ACCEPT_ATTACH = "image/*,application/pdf,.pdf,.txt,.md,.csv,.tsv,.json,text/plain,text/markdown,text/csv";

export function attachKind(file: { type: string; name: string }): AttachKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return "pdf";
  if (file.type.startsWith("text/") || /\.(txt|md|csv|tsv|json)$/i.test(file.name)) return "text";
  return null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Page count of a PDF from its data URL (counts page objects; good enough for display). */
export function countPdfPages(dataUrl: string): number | undefined {
  try {
    const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const bin = typeof atob === "function" ? atob(b64) : "";
    const n = (bin.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
    return n > 0 ? n : undefined;
  } catch {
    return undefined;
  }
}

/** Why a new attachment can't be added, or null if it can. */
export function attachProblem(current: Attachment[], add: { kind: AttachKind; size: number; name: string }): string | null {
  const count = (k: AttachKind) => current.filter((a) => a.kind === k).length;
  if (add.kind === "image" && count("image") >= ATTACH_LIMITS.images) return `Up to ${ATTACH_LIMITS.images} images per message.`;
  if (add.kind === "pdf" && count("pdf") >= ATTACH_LIMITS.pdfs) return `Up to ${ATTACH_LIMITS.pdfs} PDFs per message.`;
  if (add.kind === "text" && count("text") >= ATTACH_LIMITS.texts) return `Up to ${ATTACH_LIMITS.texts} text files per message.`;
  if (add.kind === "pdf" && add.size > ATTACH_LIMITS.pdfBytes) return `${add.name} is larger than ${formatSize(ATTACH_LIMITS.pdfBytes)}.`;
  const total = current.reduce((s, a) => s + a.size, 0) + add.size;
  if (total > ATTACH_LIMITS.totalBytes) return `Attachments on one message can total up to ${formatSize(ATTACH_LIMITS.totalBytes)}.`;
  return null;
}

const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

const newId = () => Math.random().toString(36).slice(2, 10);

/** Read a file into an attachment. Images are resized by the given function first. */
export async function readAttachment(file: File, resizeImage: (f: File) => Promise<string>): Promise<Attachment> {
  const kind = attachKind(file);
  if (!kind) throw new Error(`${file.name} isn't a supported file. Attach images, PDFs or text files.`);
  if (kind === "image") return { id: newId(), kind, name: file.name || "image", size: file.size, data: await resizeImage(file) };
  if (kind === "pdf") {
    let data = await readAsDataUrl(file);
    if (!data.startsWith("data:application/pdf")) data = `data:application/pdf;base64,${data.slice(data.indexOf(",") + 1)}`;
    return { id: newId(), kind, name: file.name || "document.pdf", size: file.size, pages: countPdfPages(data), data };
  }
  const text = (await file.text()).slice(0, ATTACH_LIMITS.textChars);
  return { id: newId(), kind, name: file.name || "notes.txt", size: file.size, data: text };
}

/** What the server needs. */
export function attachmentPayload(list: Attachment[]): { kind: AttachKind; name: string; data: string }[] {
  return list.filter((a) => a.data).map((a) => ({ kind: a.kind, name: a.name, data: a.data as string }));
}

/** Saved chat history keeps images and short text files but not PDFs (they are too large for browser storage). */
export function attachmentsForStorage(list?: Attachment[]): Attachment[] | undefined {
  if (!list?.length) return list;
  return list.map((a) => (a.kind === "pdf" || (a.kind === "text" && (a.data?.length ?? 0) > 20_000) ? { ...a, data: undefined } : a));
}

/** A one-line description, e.g. "CBC report.pdf · 3 pages · 240 KB". */
export function describeAttachment(a: Attachment): string {
  const bits = [a.name];
  if (a.kind === "pdf" && a.pages) bits.push(`${a.pages} page${a.pages === 1 ? "" : "s"}`);
  bits.push(formatSize(a.size));
  return bits.join(" · ");
}
