'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Check, GripVertical, Save, Search } from 'lucide-react';

interface Subcategory { slug: string; label: string }
interface Category {
  _id: string; name: string; slug: string; icon: string;
  description: string; order: number; subcategories: Subcategory[];
  marketCount?: number;
}

const EMPTY_FORM = { name: '', slug: '', icon: '🌍', description: '', order: 99 };

function SubcatRow({
  sub,
  onRemove,
}: { sub: Subcategory; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/50 rounded-lg group">
      <GripVertical className="w-4 h-4 text-zinc-400 opacity-50 cursor-grab" />
      <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{sub.label}</span>
      <span className="text-xs font-mono text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{sub.slug}</span>
      <button onClick={onRemove} className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Category | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [subcats,    setSubcats]    = useState<Subcategory[]>([]);
  const [newSub,     setNewSub]     = useState({ slug: '', label: '' });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setSubcats([]);
    setError('');
  };

  const startEdit = (cat: Category) => {
    setSelected(cat);
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description, order: cat.order });
    setSubcats([...cat.subcategories]);
    setError('');
  };

  const addSubcat = () => {
    if (!newSub.label.trim() || !newSub.slug.trim()) return;
    setSubcats(s => [...s, { slug: newSub.slug.toLowerCase().trim(), label: newSub.label.trim() }]);
    setNewSub({ slug: '', label: '' });
  };

  const save = async () => {
    if (!form.name || !form.slug) { setError('Nom et slug requis'); return; }
    setSaving(true); setError('');
    try {
      const body = { ...form, subcategories: subcats };
      const url  = selected ? `/api/admin/categories/${selected._id}` : '/api/admin/categories';
      const res  = await fetch(url, {
        method:  selected ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      load();
      startCreate();
    } catch { setError('Erreur réseau'); }
    finally { setSaving(false); }
  };

  const del = async (cat: Category) => {
    if (!confirm(`Supprimer "${cat.name}" ?`)) return;
    const res  = await fetch(`/api/admin/categories/${cat._id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    load();
    if (selected?._id === cat._id) startCreate();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Catégories</h1>
          <p className="text-sm text-zinc-500">Structuration de la plateforme</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-medium text-white dark:text-zinc-900 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nouvelle catégorie
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

        {/* ── Left: list ───────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-12 flex justify-center text-zinc-500">
              <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-800 dark:border-t-zinc-300 rounded-full animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-zinc-200 dark:border-zinc-700">🌍</div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Aucune catégorie</p>
              <p className="text-sm text-zinc-500 mt-1">Créez-en une à droite</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {categories.map(cat => (
                <div
                  key={cat._id}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-colors group ${selected?._id === cat._id ? 'bg-zinc-50 dark:bg-zinc-800/60' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'}`}
                  onClick={() => startEdit(cat)}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border transition-all ${selected?._id === cat._id ? 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm scale-105' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'}`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {cat.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">/{cat.slug}</span>
                      <span className="text-xs text-zinc-500">{cat.subcategories.length} sous-cat</span>
                      <span className="text-xs text-zinc-500">• {cat.marketCount ?? 0} marchés</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); startEdit(cat); }}
                      className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      title="Éditer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); del(cat); }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: form ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg sticky top-8">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              {selected ? <Pencil className="w-4 h-4 text-zinc-400" /> : <Plus className="w-4 h-4 text-zinc-400" />}
              {selected ? `Modifier — ${selected.name}` : 'Nouvelle catégorie'}
            </h2>
          </div>

          <div className="p-5">
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 block uppercase tracking-wide">Nom <span className="text-red-500">*</span></label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Sport"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-400"
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 block uppercase tracking-wide text-center">Icône</label>
                  <input
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="⚽"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-xl text-center outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 block uppercase tracking-wide">Slug (URL) <span className="text-red-500">*</span></label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="sport"
                  disabled={!!selected}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-sm font-mono outline-none disabled:opacity-50 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-400"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 block uppercase tracking-wide">Description</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optionnelle"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-400"
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 block uppercase tracking-wide text-center">Ordre</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 99 }))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-sm text-center font-mono outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Sous-catégories</label>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{subcats.length}</span>
                </div>
                
                <div className="flex flex-col gap-2 mb-3">
                  {subcats.map((s, i) => (
                    <SubcatRow key={i} sub={s} onRemove={() => setSubcats(sc => sc.filter((_, j) => j !== i))} />
                  ))}
                  {subcats.length === 0 && (
                    <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-800 border-dashed">
                      Aucune sous-catégorie
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    value={newSub.label}
                    onChange={e => {
                      const label = e.target.value;
                      const slug  = label.toLowerCase().replace(/\s+/g, '-').replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u').replace(/ç/g, 'c');
                      setNewSub({ label, slug });
                    }}
                    placeholder="Nom"
                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none w-full"
                    onKeyDown={e => e.key === 'Enter' && addSubcat()}
                  />
                  <input
                    value={newSub.slug}
                    onChange={e => setNewSub(s => ({ ...s, slug: e.target.value }))}
                    placeholder="slug"
                    className="w-24 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-xs font-mono outline-none"
                    onKeyDown={e => e.key === 'Enter' && addSubcat()}
                  />
                  <button
                    onClick={addSubcat}
                    disabled={!newSub.label.trim()}
                    className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                {selected && (
                  <button
                    onClick={startCreate}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    Annuler
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Enregistrement…' : selected ? 'Mettre à jour' : 'Créer la catégorie'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
