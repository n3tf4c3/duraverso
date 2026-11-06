'use client';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, localeMeta, locales, localizePath, type Dictionary, type Locale } from '@/lib/i18n';
import { Flag } from './flag';

function subscribeLocation(update: () => void) { window.addEventListener('popstate', update); window.addEventListener('hashchange', update); return () => { window.removeEventListener('popstate', update); window.removeEventListener('hashchange', update); }; }
function locationSuffix() { return window.location.search + window.location.hash; }
function serverSuffix() { return ''; }

export function LanguageSwitcher({ locale, labels }: { locale: Locale; labels: Dictionary['header'] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname(); const suffix = useSyncExternalStore(subscribeLocation, locationSuffix, serverSuffix);
  const wrap = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null); const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const id = useId(); const current = localeMeta[locale];
  useEffect(() => {
    if (!open) return;
    links.current[locales.indexOf(locale)]?.focus();
    const outside = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, locale]);
  function key(event: KeyboardEvent) {
    const index = links.current.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    const target = event.key === 'ArrowDown' ? (index + 1) % 3 : event.key === 'ArrowUp' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
    if (target !== null) { event.preventDefault(); links.current[target]?.focus(); }
  }
  return <div className="language-switcher" ref={wrap} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button type="button" className="language-trigger" ref={trigger} aria-label={`${labels.langButton}: ${current.name}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} onKeyDown={(event) => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); } }}>
      <Flag locale={locale} /><span className="language-name">{current.name}</span><span className="language-short">{current.short}</span><span aria-hidden="true">{open ? '⌃' : '⌄'}</span>
    </button>
    <div id={id} role="group" aria-label={labels.menuTitle} className="language-menu" hidden={!open} onKeyDown={key}>
      <p className="eyebrow">{labels.menuTitle}</p>
      {locales.map((language, index) => <a key={language} ref={(element) => { links.current[index] = element; }} href={localizePath(path, language) + suffix} hrefLang={localeMeta[language].tag} lang={localeMeta[language].tag} aria-current={language === locale ? 'true' : undefined} onClick={(event) => {
        document.cookie = `${LOCALE_COOKIE}=${language}; Max-Age=${LOCALE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        // Navegação completa evita reusar prefetch feito antes da alteração do cookie.
        event.currentTarget.href = localizePath(location.pathname, language) + location.search + location.hash;
      }}><Flag locale={language} width={30} /><span><strong>{localeMeta[language].name}</strong><small>{localeMeta[language].country}</small></span>{language === locale && <span aria-hidden="true">✓</span>}</a>)}
      <p className="small">{labels.menuNote}</p>
    </div>
  </div>;
}
