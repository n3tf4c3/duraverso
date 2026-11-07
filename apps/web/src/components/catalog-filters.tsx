'use client';
import { useId, useRef, useState } from 'react';
import { brands, productCategories } from '@duraverso/core';
import { localizePath, type Dictionary, type Locale } from '@/lib/i18n';
import { categoryLabel } from '@/lib/product-presentation';
import { extraCopy } from '@/lib/copy';

type FiltersProps = {
  locale: Locale;
  labels: Dictionary['catalog'];
  q: string;
  brand: string;
  capacity: string;
  category: string;
};

function FilterFields({ locale, labels: t, q, brand, capacity, category, prefix }: FiltersProps & { prefix: string }) {
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedCapacity, setSelectedCapacity] = useState(capacity);
  const c = extraCopy(locale);
  const supportsCapacity = !selectedCategory || selectedCategory === 'washing_machine';
  return (
    <form action={localizePath('/produtos', locale)}>
      <input type="hidden" name="q" value={q} />
      <div className="filter-select">
        <label htmlFor={`${prefix}-category`}>{t.category}</label>
        <select
          id={`${prefix}-category`}
          name="category"
          value={selectedCategory}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedCategory(value);
            if (value && value !== 'washing_machine') setSelectedCapacity('');
          }}
        >
          <option value="">{t.allCategories}</option>
          {productCategories.map((value) => (
            <option key={value} value={value}>
              {categoryLabel(value, locale)}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-select">
        <label htmlFor={`${prefix}-brand`}>{t.brand}</label>
        <select id={`${prefix}-brand`} name="brand" defaultValue={brand}>
          <option value="">{t.allBrands}</option>
          {brands.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <fieldset disabled={!supportsCapacity}>
        <legend>{t.capacity}</legend>
        <p className="small">{t.capacityHint}</p>
        {[
          ['', t.allCapacities],
          ['small', t.capUpTo10],
          ['medium', t.cap10to13],
          ['large', t.capOver13],
        ].map(([value, label]) => (
          <label key={value} htmlFor={`${prefix}-capacity-${value}`}>
            <input
              id={`${prefix}-capacity-${value}`}
              type="radio"
              name="capacity"
              value={value}
              checked={value === selectedCapacity}
              onChange={() => setSelectedCapacity(value!)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <button className="button button-primary" type="submit">
        {c.apply} →
      </button>
      <a className="clear-filters" href={localizePath('/produtos', locale)}>
        {t.clear}
      </a>
    </form>
  );
}

export function CatalogFilters(props: FiltersProps) {
  const { locale, labels: t, brand, capacity, category } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <>
      <button
        ref={trigger}
        className="button button-outline filters-trigger"
        type="button"
        aria-expanded={expanded}
        aria-controls={`${id} ${id}-dialog`}
        onClick={() => {
          if (window.matchMedia('(max-width: 599px)').matches) {
            dialog.current?.showModal();
            setExpanded(true);
          } else setExpanded(!expanded);
        }}
      >
        {t.filters} {brand || capacity || category ? '·' : '+'}
      </button>
      <aside id={id} className={`filters ${expanded ? 'filters-expanded' : ''}`}>
        <h2>{t.filters}</h2>
        <FilterFields {...props} prefix={`${id}-inline`} />
      </aside>
      <dialog
        id={`${id}-dialog`}
        className="filters-dialog"
        ref={dialog}
        aria-labelledby={`${id}-title`}
        onClose={() => {
          setExpanded(false);
          trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="dialog-heading">
          <h2 id={`${id}-title`}>{t.filters}</h2>
          <button
            type="button"
            className="button button-outline"
            onClick={() => dialog.current?.close()}
            aria-label={locale === 'pt' ? 'Fechar filtros' : locale === 'en' ? 'Close filters' : 'Cerrar filtros'}
          >
            ×
          </button>
        </div>
        <FilterFields {...props} prefix={`${id}-modal`} />
      </dialog>
    </>
  );
}
