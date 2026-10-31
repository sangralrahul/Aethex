import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit3, Trash2, Eye, EyeOff, Download, Loader2, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Clinical Tips", "NEET-PG Prep", "Medical News", "Product Guides", "Doctor Life", "Research & Studies"];
const apiBase = () => import.meta.env.BASE_URL.replace(/\/$/, "");
const INPUT = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

interface BlogFormProps { initial?: any; onSave: (data: any) => Promise<void>; onCancel: () => void; saving: boolean; }

function BlogForm({ initial, onSave, onCancel, saving }: BlogFormProps) {
  const [form, setForm] = useState({
    title: initial?.title ?? "", slug: initial?.slug ?? "", excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "", featuredImage: initial?.featuredImage ?? "",
    category: initial?.category ?? "Clinical Tips", authorName: initial?.authorName ?? "Aethex Editorial",
    authorRole: initial?.authorRole ?? "Medical Writer", published: initial?.published ?? false,
    scheduledAt: initial?.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0, 16) : "",
    seoTitle: initial?.seoTitle ?? "", seoDescription: initial?.seoDescription ?? "",
    readTime: initial?.readTime ?? 5, tags: (initial?.tags as string[] ?? []).join(", "),
  });
  const [preview, setPreview] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-xl text-slate-900">{initial ? "Edit Post" : "New Blog Post"}</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPreview(!preview)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary transition-all">
            {preview ? <><EyeOff className="w-4 h-4" /> Edit</> : <><Eye className="w-4 h-4" /> Preview</>}
          </button>
        </div>
      </div>

      {preview ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {form.featuredImage && <img src={form.featuredImage} alt="" className="w-full h-56 object-cover" />}
          <div className="p-6">
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{form.category}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-3 mb-2">{form.title || "Untitled"}</h1>
            <p className="text-slate-500 mb-4">{form.excerpt}</p>
            <div className="prose prose-slate max-w-none text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.content) }} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => { set("title", e.target.value); if (!initial) set("slug", autoSlug(e.target.value)); }} className={INPUT} placeholder="Article title..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug *</label>
            <input value={form.slug} onChange={e => set("slug", e.target.value)} className={INPUT + " font-mono text-xs"} placeholder="my-article-slug" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className={INPUT}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Excerpt *</label>
            <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={2} className={INPUT + " resize-none"} placeholder="Short summary of the article..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Author Name</label>
            <input value={form.authorName} onChange={e => set("authorName", e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Author Role</label>
            <input value={form.authorRole} onChange={e => set("authorRole", e.target.value)} className={INPUT} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Featured Image URL</label>
            <input value={form.featuredImage} onChange={e => set("featuredImage", e.target.value)} className={INPUT} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Read Time (minutes)</label>
            <input type="number" value={form.readTime} onChange={e => set("readTime", parseInt(e.target.value))} className={INPUT} min={1} max={60} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} className={INPUT} placeholder="NEET-PG, clinical, tips" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">SEO Title</label>
            <input value={form.seoTitle} onChange={e => set("seoTitle", e.target.value)} className={INPUT} placeholder="Leave blank to use post title" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Schedule Publish Date</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => set("scheduledAt", e.target.value)} className={INPUT} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">SEO Description</label>
            <textarea value={form.seoDescription} onChange={e => set("seoDescription", e.target.value)} rows={2} className={INPUT + " resize-none"} placeholder="Meta description for Google (160 chars max)..." maxLength={160} />
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">Content * (HTML supported)</label>
              <span className="text-xs text-slate-400">~{Math.ceil((form.content.split(" ").length) / 200)} min read</span>
            </div>
            <textarea value={form.content} onChange={e => set("content", e.target.value)} rows={16}
              className={INPUT + " resize-y font-mono text-xs leading-relaxed"}
              placeholder="<h2>Section heading</h2><p>Your article content here...</p>" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm font-semibold text-slate-700">{form.published ? "Published" : "Draft (not visible)"}</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={() => onSave({ ...form, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean), scheduledAt: form.scheduledAt || undefined })}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? "Save Changes" : "Create Post"}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl transition-all">Cancel</button>
      </div>
    </div>
  );
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [subCount, setSubCount] = useState<number | null>(null);

  const fetchPosts = () => {
    fetch(`${apiBase()}/api/admin/blog/posts`).then(r => r.json()).then(d => setPosts(d.posts ?? [])).catch(() => {}).finally(() => setLoading(false));
    fetch(`${apiBase()}/api/admin/newsletter/subscribers`).then(r => r.json()).then(d => setSubCount(d.count ?? 0)).catch(() => {});
  };

  useEffect(fetchPosts, []);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const url = editingPost ? `${apiBase()}/api/admin/blog/posts/${editingPost.id}` : `${apiBase()}/api/admin/blog/posts`;
      const method = editingPost ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { fetchPosts(); setShowForm(false); setEditingPost(null); }
    } finally { setSaving(false); }
  };

  const togglePublish = async (post: any) => {
    await fetch(`${apiBase()}/api/admin/blog/posts/${post.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !post.published }),
    });
    fetchPosts();
  };

  const deletePost = async (id: number) => {
    if (!confirm("Delete this post permanently?")) return;
    await fetch(`${apiBase()}/api/admin/blog/posts/${id}`, { method: "DELETE" });
    setPosts(p => p.filter(x => x.id !== id));
  };

  const downloadSubscribers = () => {
    window.open(`${apiBase()}/api/admin/newsletter/subscribers?format=csv`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 text-sm transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Store</Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blog Management</h1>
            <p className="text-slate-500 text-sm mt-1">{posts.length} articles · {subCount !== null ? `${subCount} newsletter subscribers` : "Loading subscribers..."}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadSubscribers}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:border-primary hover:text-primary transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export Subscribers
            </button>
            {!showForm && !editingPost && (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm">
                <Plus className="w-4 h-4" /> New Post
              </button>
            )}
          </div>
        </div>

        {(showForm || editingPost) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
            <BlogForm initial={editingPost} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingPost(null); }} saving={saving} />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white animate-pulse rounded-2xl" />)}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No blog posts yet</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold">Create First Post</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Author</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Views</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.featuredImage && <img src={post.featuredImage} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0" />}
                        <div>
                          <p className="font-semibold text-slate-800 text-sm line-clamp-1">{post.title}</p>
                          <p className="text-xs text-slate-400 font-mono">{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{post.category}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{post.authorName}</td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-1 text-xs font-bold w-fit px-2 py-0.5 rounded-full", post.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {post.published ? <><CheckCircle2 className="w-3 h-3" /> Live</> : <><Clock className="w-3 h-3" /> Draft</>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{post.views}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(post.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/blog/${post.slug}`}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Eye className="w-4 h-4" /></Link>
                        <button onClick={() => togglePublish(post)}
                          className={cn("p-1.5 rounded-lg transition-all", post.published ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50")}>
                          {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setEditingPost(post); setShowForm(false); }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deletePost(post.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
