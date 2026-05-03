import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useAppConfig } from '../../hooks/useAppConfig';
import { adminProductService, type RawProductInput } from '../../services/adminProductService';
import { resizeImage } from '../../utils/imageUtils';

const DEFAULT_LOCALIZED = { pt: '', en: '', es: '', zh: '', ja: '' };
const LANGUAGES = [
  { key: 'pt', label: 'PT' },
  { key: 'en', label: 'EN' },
  { key: 'es', label: 'ES' },
  { key: 'zh', label: 'ZH' },
  { key: 'ja', label: 'JA' },
] as const;

type VariantField =
  | { kind: 'top'; field: 'sku' | 'stock' }
  | { kind: 'attributes'; key: string }
  | { kind: 'prices'; key: 'brlCents' | 'usdCents' };

const toIntCents = (value: string): number => {
  const numberValue = parseInt(value, 10);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
};

export default function AdminProductForm() {
  const { token } = useAuth();
  const { theme, t } = useAppConfig();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [mediaFeedback, setMediaFeedback] = useState('');

  const [form, setForm] = useState<RawProductInput>({
    name: { ...DEFAULT_LOCALIZED },
    description: { ...DEFAULT_LOCALIZED },
    imageUrl: '',
    active: true,
    variants: [{
      sku: '',
      attributes: { modelo: t.admin.productForm.defaultModel },
      prices: { brlCents: 0, usdCents: 0 },
      stock: 0,
      active: true
    }]
  });

  useEffect(() => {
    if (isEdit && token) {
      const loadProduct = async () => {
        try {
          const product = await adminProductService.getProduct(token, id);

          setForm({
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl || '',
            active: product.active,
            variants: product.variants.map(v => ({
              id: v.id,
              sku: v.sku,
              attributes: v.attributes,
              prices: v.prices,
              stock: v.stock,
              active: v.active
            }))
          });
        } catch {
          setError(t.admin.productForm.loadError);
        } finally {
          setIsLoading(false);
        }
      };
      loadProduct();
    }
  }, [id, isEdit, token]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMediaFeedback(t.admin.productForm.fileTooLarge);
      return;
    }

    try {
      const base64 = await resizeImage(file, 800, 800);
      setForm(prev => ({ ...prev, imageUrl: base64 }));
      setMediaFeedback('');
    } catch {
      setMediaFeedback(t.admin.productForm.imageError);
    }
  };

  const handleVariantChange = (index: number, target: VariantField, value: string | number) => {
    setForm(prev => {
      const variant = prev.variants[index];
      if (!variant) return prev;

      let updated = variant;
      if (target.kind === 'top') {
        updated = { ...variant, [target.field]: value };
      } else if (target.kind === 'attributes') {
        updated = { ...variant, attributes: { ...variant.attributes, [target.key]: String(value) } };
      } else {
        updated = { ...variant, prices: { ...variant.prices, [target.key]: Number(value) } };
      }

      const variants = [...prev.variants];
      variants[index] = updated;
      return { ...prev, variants };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError('');

    try {
      if (isEdit) {
        await adminProductService.updateProduct(token, id, form);
      } else {
        await adminProductService.createProduct(token, form);
      }
      navigate('/manage/products');
    } catch {
      setError(t.admin.productForm.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-center py-20">{t.admin.productForm.loading}</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/manage/products')} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#2A2A2A]' : 'hover:bg-[#E0E0E0]'}`} aria-label={t.admin.common.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? t.admin.productForm.editTitle : t.admin.productForm.newTitle}
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-sm mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className={`border rounded-lg p-6 space-y-6 ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
            <h2 className="text-sm uppercase tracking-widest font-bold opacity-80">{t.admin.productForm.basicInfo}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {LANGUAGES.map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={`product-name-${key}`} className="block text-xs uppercase tracking-widest opacity-80 font-semibold mb-2">{t.admin.productForm.name} ({label})</label>
                  <input
                    id={`product-name-${key}`}
                    type="text" required value={form.name[key]}
                    onChange={e => setForm({ ...form, name: { ...form.name, [key]: e.target.value } })}
                    className={`w-full border rounded-sm px-4 py-2 text-sm focus:outline-none ${isDark ? 'bg-[#111111] border-[#2A2A2A] focus:border-white/40' : 'bg-[#F5F5F5] border-[#D0D0D0] focus:border-black/40'}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {LANGUAGES.map(({ key, label }) => (
                <div key={key} className={key === 'ja' ? 'md:col-span-2' : ''}>
                  <label htmlFor={`product-description-${key}`} className="block text-xs uppercase tracking-widest opacity-80 font-semibold mb-2">{t.admin.productForm.description} ({label})</label>
                  <textarea
                    id={`product-description-${key}`}
                    rows={3} required value={form.description[key]}
                    onChange={e => setForm({ ...form, description: { ...form.description, [key]: e.target.value } })}
                    className={`w-full border rounded-sm px-4 py-2 text-sm focus:outline-none resize-none ${isDark ? 'bg-[#111111] border-[#2A2A2A] focus:border-white/40' : 'bg-[#F5F5F5] border-[#D0D0D0] focus:border-black/40'}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className={`border rounded-lg p-6 space-y-6 ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-sm uppercase tracking-widest font-bold opacity-80">{t.admin.productForm.variants}</h2>
              <button
                type="button"
                onClick={() => setForm({ ...form, variants: [...form.variants, { sku: '', attributes: { modelo: '' }, prices: { brlCents: 0, usdCents: 0 }, stock: 0, active: true }] })}
                className="text-[10px] uppercase font-bold text-gray-400 hover:text-white flex items-center gap-1"
              >
                <Plus size={14} /> {t.admin.productForm.addVariant}
              </button>
            </div>

            <div className="space-y-4">
              {form.variants.map((variant, idx) => (
                <div key={idx} className={`p-4 border rounded-sm space-y-4 relative group ${isDark ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#F5F5F5] border-[#E0E0E0]'}`}>
                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) })}
                      className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label htmlFor={`variant-${idx}-sku`} className="block text-[10px] uppercase opacity-80 font-bold mb-1">{t.admin.productForm.sku}</label>
                      <input id={`variant-${idx}-sku`} type="text" required value={variant.sku} onChange={e => handleVariantChange(idx, { kind: 'top', field: 'sku' }, e.target.value)} className={`w-full border px-2 py-1 text-xs focus:outline-none ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A] focus:border-white/40' : 'bg-white border-[#D0D0D0] focus:border-black/40'}`} />
                    </div>
                    <div>
                      <label htmlFor={`variant-${idx}-model`} className="block text-[10px] uppercase opacity-80 font-bold mb-1">{t.admin.productForm.model}</label>
                      <input id={`variant-${idx}-model`} type="text" required value={variant.attributes.modelo} onChange={e => handleVariantChange(idx, { kind: 'attributes', key: 'modelo' }, e.target.value)} className={`w-full border px-2 py-1 text-xs focus:outline-none ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A] focus:border-white/40' : 'bg-white border-[#D0D0D0] focus:border-black/40'}`} />
                    </div>
                    <div>
                      <label htmlFor={`variant-${idx}-brl`} className="block text-[10px] uppercase opacity-80 font-bold mb-1">{t.admin.productForm.priceBrl}</label>
                      <input id={`variant-${idx}-brl`} type="number" required min={0} value={variant.prices.brlCents} onChange={e => handleVariantChange(idx, { kind: 'prices', key: 'brlCents' }, toIntCents(e.target.value))} className={`w-full border px-2 py-1 text-xs focus:outline-none ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A] focus:border-white/40' : 'bg-white border-[#D0D0D0] focus:border-black/40'}`} />
                    </div>
                    <div>
                      <label htmlFor={`variant-${idx}-usd`} className="block text-[10px] uppercase opacity-80 font-bold mb-1">{t.admin.productForm.priceUsd}</label>
                      <input id={`variant-${idx}-usd`} type="number" required min={0} value={variant.prices.usdCents} onChange={e => handleVariantChange(idx, { kind: 'prices', key: 'usdCents' }, toIntCents(e.target.value))} className={`w-full border px-2 py-1 text-xs focus:outline-none ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A] focus:border-white/40' : 'bg-white border-[#D0D0D0] focus:border-black/40'}`} />
                    </div>
                    <div>
                      <label htmlFor={`variant-${idx}-stock`} className="block text-[10px] uppercase opacity-80 font-bold mb-1">{t.admin.productForm.stock}</label>
                      <input id={`variant-${idx}-stock`} type="number" required min={0} value={variant.stock} onChange={e => handleVariantChange(idx, { kind: 'top', field: 'stock' }, toIntCents(e.target.value))} className={`w-full border px-2 py-1 text-xs focus:outline-none ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A] focus:border-white/40' : 'bg-white border-[#D0D0D0] focus:border-black/40'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Media & Actions */}
        <div className="space-y-8">
          <section className={`border rounded-lg p-6 space-y-6 ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
            <h2 className="text-sm uppercase tracking-widest font-bold opacity-80">{t.admin.productForm.media}</h2>
            {mediaFeedback && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-3 py-2 rounded-sm text-xs">
                {mediaFeedback}
              </div>
            )}
            
            <div className={`aspect-square border border-dashed rounded-sm relative group overflow-hidden ${isDark ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#F5F5F5] border-[#D0D0D0]'}`}>
              {form.imageUrl ? (
                <>
                  <img src={form.imageUrl} alt={t.admin.productForm.previewAlt} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: '' })}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                  <Upload size={32} className="text-gray-600 mb-2" />
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">{t.admin.productForm.uploadImage}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-[10px] text-gray-500 text-center font-medium opacity-70">{t.admin.productForm.imageRecommended}</p>
          </section>

          <section className={`border rounded-lg p-6 space-y-6 ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold opacity-80">{t.admin.productForm.activateProduct}</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-10 h-5 rounded-full transition-colors relative ${form.active ? 'bg-green-500' : 'bg-[#2A2A2A]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#E0E0E0] text-[#181818] py-4 rounded-sm text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#CACACA] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {isSaving ? t.admin.common.saving : isEdit ? t.admin.productForm.saveChanges : t.admin.productForm.createProduct}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
