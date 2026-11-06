'use client';
import { useId, useRef, useState } from 'react';
import { brands, productCategories } from '@duraverso/core';
import { localizePath, type Dictionary, type Locale } from '@/lib/i18n';
import { categoryLabel } from '@/lib/product-presentation';
import { extraCopy } from '@/lib/copy';

type FiltersProps = { locale: Locale; labels: Dictionary['catalog']; q: string; brand: string; capacity: string; category: string };

function FilterFields({ locale, labels: t, q, brand, capacity, category, prefix }: FiltersProps & { prefix: string }) {
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedCapacity, setSelectedCapacity] = useState(capacity);
  const c = extraCopy(locale);
  const supportsCapacity = !selectedCategory || selectedCategory === 'washing_machine';
  return <form action={localizePath('/produtos', locale)}>
    <input type="hidden" name="q" value={q} />
    <fieldset><legend>{t.category}</legend>{[['', t.allCategories], ...productCategories.map((value) => [value, categoryLabel(value, locale)])].map(([value, label]) => <label key={value} htmlFor={`${prefix}-category-${value}`}><input id={`${prefix}-category-${value}`} type="radio" name="category" value={value} checked={value === selectedCategory} onChange={() => { setSelectedCategory(value!); if (value && value !== 'washing_machine') setSelectedCapacity(''); }} />{label}</label>)}</fieldset>
    <fieldset><legend>{t.brand}</legend>{[['', t.allBrands], ...brands.map((b) => [b, b])].map(([value, label]) => <label key={value} htmlFor={`${prefix}-brand-${value}`}><input id={`${prefix}-brand-${value}`} type="radio" name="brand" value={value} defaultChecked={value === brand} />{label}</label>)}</fieldset>
    <fieldset disabled={!supportsCapacity}><legend>{t.capacity}</legend><p className="small">{t.capacityHint}</p>{[['', t.allCapacities], ['small', t.capUpTo10], ['medium', t.cap10to13], ['large', t.capOver13]].map(([value, label]) => <label key={value} htmlFor={`${prefix}-capacity-${value}`}><input id={`${prefix}-capacity-${value}`} type="radio" name="capacity" value={value} checked={value === selectedCapacity} onChange={() => setSelectedCapacity(value!)} />{label}</label>)}</fieldset>
    <button className="button button-primary" type="submit">{c.apply} →</button><a className="clear-filters" href={localizePath('/produtos', locale)}>{t.clear}</a>
  </form>;
}

export function CatalogFilters(props: FiltersProps) {
  const { locale, labels: t, brand, capacity, category } = props;
  const dialog = useRef<HTMLDialogElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false); const id = useId();
  return <>
    <button ref={trigger} className="button button-outline filters-trigger" type="button" aria-expanded={expanded} aria-controls={id} onClick={() => { if (window.matchMedia('(max-width: 599px)').matches) { dialog.current?.showModal(); setExpanded(true); } else setExpanded(!expanded); }}>{t.filters} {brand || capacity || category ? '·' : '+'}</button>
    <aside id={id} className={`filters ${expanded ? 'filters-expanded' : ''}`}><h2>{t.filters}</h2><FilterFields {...props} prefix={`${id}-inline`} /></aside>
    <dialog className="filters-dialog" ref={dialog} aria-labelledby={`${id}-title`} onClose={() => { setExpanded(false); trigger.current?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="dialog-heading"><h2 id={`${id}-title`}>{t.filters}</h2><button type="button" className="button button-outline" onClick={() => dialog.current?.close()} aria-label={locale === 'pt' ? 'Fechar filtros' : locale === 'en' ? 'Close filters' : 'Cerrar filtros'}>×</button></div><FilterFields {...props} prefix={`${id}-modal`} />
    </dialog>
  </>;
}
