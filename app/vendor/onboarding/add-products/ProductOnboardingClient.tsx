'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, CheckCircle2, Plus, Search } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import { Button, LargeTitle, Notice, Pill, Row, StickyBar, StickyBarSpacer, rupees } from '@/components/app/ui';
import { Field, RupeeInput, inputClass } from '@/components/app/form';
import { IconBox, List, SectionHeader } from '@/components/app/seller';

interface Category {
  id: string;
  name: string;
}

interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  suggestedImage: string | null;
  suggestedPrice: number | null;
  suggestedWeight: number | null;
  isPopular: boolean;
  tags: string[];
  category: {
    id: string;
    name: string;
  };
}

interface AddedProduct {
  templateId: string;
  name: string;
  price: number;
  stockQuantity: number;
}

interface ProductOnboardingClientProps {
  vendorId: string;
  businessType: string;
  categories: Category[];
  hasExistingProducts: boolean;
}

// A ticked suggestion with the shop's own price and stock
interface Picked {
  template: ProductTemplate;
  price: string;
  stock: string;
}

type RowErrors = Record<string, { price?: string; stock?: string }>;

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

// businessType is passed in but not used here yet
export default function ProductOnboardingClient({
  vendorId,
  categories,
  hasExistingProducts,
}: ProductOnboardingClientProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '');
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [picked, setPicked] = useState<Record<string, Picked>>({});
  const [rowErrors, setRowErrors] = useState<RowErrors>({});
  const [addingProduct, setAddingProduct] = useState(false);
  const [progress, setProgress] = useState(0);
  const [addTotal, setAddTotal] = useState(0);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!selectedCategory) return;

      setLoadingTemplates(true);
      try {
        const response = await fetch(
          `/api/product-templates?categoryId=${selectedCategory}&popularOnly=false`
        );
        const data = await response.json();

        if (data.success) {
          setTemplates(data.data);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
      setLoadingTemplates(false);
    };

    fetchTemplates();
  }, [selectedCategory]);

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      (template.tags && template.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    );
  });

  const pickedList = Object.values(picked);
  const pickedCount = pickedList.length;

  const togglePick = (template: ProductTemplate) => {
    setPicked((prev) => {
      const next = { ...prev };
      if (next[template.id]) delete next[template.id];
      else next[template.id] = { template, price: template.suggestedPrice?.toString() || '', stock: '50' };
      return next;
    });
    setRowErrors((prev) => ({ ...prev, [template.id]: {} }));
  };

  const updatePick = (id: string, field: 'price' | 'stock', value: string) => {
    setPicked((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], [field]: value } } : prev));
    setRowErrors((prev) => ({ ...prev, [id]: { ...prev[id], [field]: undefined } }));
  };

  // Create one product from a suggestion (same request as before, one per ticked row)
  const handleQuickAdd = async ({ template, price, stock }: Picked): Promise<boolean> => {
    try {
      const { apiClient } = await import('@/lib/api/client');

      // Create basic product from template
      const data = await apiClient.createVendorProduct({
        vendorId,
        name: template.name,
        description: template.description,
        categoryId: template.category.id,
        images: [], // No images for now - vendor can add later
        price: parseFloat(price),
        compareAtPrice: null,
        sku: null,
        stockQuantity: parseInt(stock),
        lowStockThreshold: 10,
        weight: template.suggestedWeight,
        isActive: true,
      });

      if (data.success) {
        // Track added product
        setAddedProducts((prev) => [
          ...prev,
          {
            templateId: template.id,
            name: template.name,
            price: parseFloat(price),
            stockQuantity: parseInt(stock),
          },
        ]);

        // Record template usage — the product already exists, so a failure here is not an error
        await fetch(`/api/product-templates/${template.id}/use`, {
          method: 'POST',
        }).catch(() => undefined);

        return true;
      }
      console.error('Product creation failed:', (data as { error?: string }).error || data.message);
      return false;
    } catch (error) {
      console.error('Product creation error:', error);
      return false;
    }
  };

  const handleAddPicked = async () => {
    if (pickedCount === 0 || addingProduct) return;

    // Every ticked product needs a price and a stock count
    const errs: RowErrors = {};
    for (const p of pickedList) {
      const e: { price?: string; stock?: string } = {};
      if (!p.price || isNaN(parseFloat(p.price))) e.price = 'Add a price — customers need it to order';
      if (!p.stock || isNaN(parseInt(p.stock))) e.stock = 'Add how many you have';
      if (e.price || e.stock) errs[p.template.id] = e;
    }
    setRowErrors(errs);
    const firstBad = pickedList.find((p) => errs[p.template.id]);
    if (firstBad) {
      // Show the row that needs fixing, even if it's in another category
      if (firstBad.template.category.id !== selectedCategory && categories.some((c) => c.id === firstBad.template.category.id)) {
        setSelectedCategory(firstBad.template.category.id);
      }
      setSearchQuery('');
      toast.error(`Add a price and stock for ${firstBad.template.name}`);
      setTimeout(() => {
        document.getElementById(`price-${firstBad.template.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
      return;
    }

    setAddingProduct(true);
    setAddTotal(pickedList.length);
    const failed: string[] = [];
    let added = 0;
    for (const [i, p] of pickedList.entries()) {
      setProgress(i + 1);
      if (await handleQuickAdd(p)) {
        added += 1;
        setPicked((prev) => {
          const next = { ...prev };
          delete next[p.template.id];
          return next;
        });
      } else {
        failed.push(p.template.name);
      }
    }
    setAddingProduct(false);
    setProgress(0);

    if (failed.length === 0) {
      toast.success(`${added} product${added === 1 ? '' : 's'} added to your shop`);
      router.push('/vendor/dashboard');
      return;
    }
    if (added > 0) toast.success(`${added} product${added === 1 ? '' : 's'} added`);
    toast.error(`Couldn't add ${failed.join(', ')}. They are still ticked — tap Add to try again.`);
  };

  const handleFinishOnboarding = async () => {
    if (addedProducts.length === 0) {
      const ok = await confirm({
        title: 'Skip adding products?',
        description: 'You can add products any time from your shop.',
        confirmLabel: 'Skip for now',
        cancelLabel: 'Add products',
      });
      if (!ok) return;
    }

    router.push('/vendor/dashboard');
  };

  const handleAddManually = () => {
    router.push('/vendor/products/new');
  };

  const categoryName = categories.find((c) => c.id === selectedCategory)?.name;

  return (
    <>
      <LargeTitle
        title={hasExistingProducts ? 'Add more products' : 'Add your first products'}
        subtitle="Tick what you sell and set your price · अपना सामान चुनें"
      />

      {addedProducts.length > 0 && (
        <div className="mb-4">
          <Notice tone="ok" icon={<CheckCircle2 className="h-5 w-5 text-ok" aria-hidden />}>
            {addedProducts.length} product{addedProducts.length > 1 ? 's' : ''} added to your shop
          </Notice>
        </div>
      )}

      {/* Category chips */}
      {categories.length > 0 && (
        <div
          role="group"
          aria-label="Product type"
          className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((category) => {
            const on = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSelectedCategory(category.id)}
                className={cx(
                  'h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-[15px] transition-colors cursor-pointer',
                  on ? 'bg-tint-soft font-semibold text-tint' : 'bg-card font-medium text-label-2 hover:text-label',
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3" aria-hidden />
        <input
          type="search"
          placeholder="Search, e.g. oil, soap, saree"
          aria-label="Search suggestions"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cx(inputClass, 'pl-11')}
        />
      </div>

      {/* Suggestions */}
      <section className="mb-6">
        <SectionHeader title={categoryName ? `Suggestions · ${categoryName}` : 'Suggestions'} />
        {loadingTemplates ? (
          <List>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="h-7 w-7 animate-pulse rounded-lg bg-fill" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 animate-pulse rounded-2xl bg-fill" />
                  <div className="h-3 w-1/3 animate-pulse rounded-2xl bg-fill" />
                </div>
              </div>
            ))}
          </List>
        ) : filteredTemplates.length > 0 ? (
          <List>
            {filteredTemplates.map((template) => {
              const isAdded = addedProducts.some((p) => p.templateId === template.id);
              const pick = picked[template.id];
              const err = rowErrors[template.id] || {};
              return (
                <div key={template.id} className={cx('px-4 py-3', pick && 'bg-tint-soft/40')}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={!!pick || isAdded}
                    disabled={isAdded || addingProduct}
                    onClick={() => togglePick(template)}
                    className="flex min-h-[48px] w-full items-start gap-3 text-left cursor-pointer disabled:cursor-default"
                  >
                    <span
                      aria-hidden
                      className={cx(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                        isAdded ? 'border-ok bg-ok text-white' : pick ? 'border-tint bg-tint text-white' : 'border-label/25 bg-card',
                      )}
                    >
                      {(pick || isAdded) && <Check className="h-[18px] w-[18px]" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold leading-snug text-label">{template.name}</span>
                      {template.description && (
                        <span className="mt-0.5 block text-[14px] leading-snug text-label-2 line-clamp-1">
                          {template.description}
                        </span>
                      )}
                      {template.suggestedPrice ? (
                        <span className="mt-0.5 block text-[14px] text-label-2">
                          Usually <span className="tabular-nums">{rupees(template.suggestedPrice)}</span>
                        </span>
                      ) : null}
                    </span>
                    {isAdded ? (
                      <Pill tone="ok">Added</Pill>
                    ) : template.isPopular ? (
                      <Pill tone="neutral">Popular</Pill>
                    ) : null}
                  </button>

                  {pick && (
                    <div className="mt-3 grid grid-cols-2 gap-3 pl-10">
                      <Field label="Your price" htmlFor={`price-${template.id}`} error={err.price}>
                        <RupeeInput
                          id={`price-${template.id}`}
                          value={pick.price}
                          onChange={(e) => updatePick(template.id, 'price', e.target.value)}
                          placeholder="0"
                          disabled={addingProduct}
                          aria-invalid={!!err.price}
                        />
                      </Field>
                      <Field label="In stock" htmlFor={`stock-${template.id}`} error={err.stock}>
                        <input
                          id={`stock-${template.id}`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={pick.stock}
                          onChange={(e) => updatePick(template.id, 'stock', e.target.value)}
                          disabled={addingProduct}
                          aria-invalid={!!err.stock}
                          className={cx(inputClass, 'tabular-nums')}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              );
            })}
          </List>
        ) : (
          <div className="rounded-2xl bg-card px-5 py-8 text-center">
            <p className="text-[17px] font-semibold text-label">No suggestions here</p>
            <p className="mx-auto mt-1 max-w-xs text-[15px] leading-snug text-label-2">
              {searchQuery ? 'Try another word, or add the product yourself.' : 'Add the product yourself with a photo, name and price.'}
            </p>
            <Button variant="secondary" size="md" className="mt-4" onClick={handleAddManually}>
              <Plus className="h-[18px] w-[18px]" aria-hidden />
              Add your own product
            </Button>
          </div>
        )}
      </section>

      {/* Not in the list */}
      {filteredTemplates.length > 0 && !loadingTemplates && (
        <section className="mb-6">
          <List>
            <Row
              onClick={handleAddManually}
              leading={
                <IconBox tone="neutral" size={40}>
                  <Plus className="h-5 w-5" />
                </IconBox>
              }
              title="Can't find it? Add your own"
              subtitle="With your own photo, name and price"
              chevron
            />
          </List>
        </section>
      )}

      <StickyBarSpacer />
      {/* No tab bar on onboarding screens, so the bar sits at the very bottom */}
      <StickyBar>
        <Button variant="secondary" onClick={handleFinishOnboarding} disabled={addingProduct} className="shrink-0">
          {addedProducts.length > 0 ? 'Go to my shop' : 'Skip for now'}
        </Button>
        <Button onClick={handleAddPicked} loading={addingProduct} disabled={addingProduct || pickedCount === 0} className="flex-1">
          {addingProduct
            ? `Adding ${progress} of ${addTotal}…`
            : pickedCount === 0
              ? 'Add products'
              : `Add ${pickedCount} product${pickedCount === 1 ? '' : 's'}`}
        </Button>
      </StickyBar>
    </>
  );
}
