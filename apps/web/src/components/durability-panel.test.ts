import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { durabilitySummary } from '@duraverso/core';
import { extraCopy } from '@/lib/copy';
import { locales } from '@/lib/i18n';
import { DurabilityPanel } from './durability-panel';

const summary = durabilitySummary([
  { startedUsing: '2026-03', confirmedMonth: '2026-11', functioning: 'working', hadRepair: false, count: 4 },
  { startedUsing: '2019-01', confirmedMonth: '2026-11', functioning: 'not_working', hadRepair: true },
]);
const render = (locale: (typeof locales)[number], value = summary) =>
  renderToStaticMarkup(createElement(DurabilityPanel, { summary: value, copy: extraCopy(locale) }));

describe('painel de durabilidade declarada', () => {
  it('sem relatos publicados não mostra painel', () => {
    expect(render('pt', durabilitySummary([]))).toBe('');
  });
  it('mostra contagens reais e só as faixas de uso com relatos', () => {
    const html = render('pt');
    expect(html).toContain('Contagem dos 5 relatos publicados');
    expect(html).toContain('<strong>4</strong> Funciona normalmente');
    expect(html).toContain('<strong>1</strong> já precisou de reparo');
    expect(html).toContain('Menos de 1 ano');
    expect(html).toContain('5 anos ou mais');
    expect(html).not.toContain('1 a 2 anos');
  });
  it.each(locales)('em %s não apresenta percentual nem nota', (locale) => {
    const html = render(locale);
    expect(html).not.toMatch(/%|\/5|★/);
    expect(html).toContain('<table');
  });
  it.each([
    ['pt', 'Contagem do único relato publicado', 'já precisou de reparo'],
    ['en', 'Count of the only published report', 'has needed a repair'],
    ['es', 'Recuento de la única experiencia publicada', 'ha necesitado reparación'],
  ] as const)('em %s, um único relato usa o singular', (locale, lead, repair) => {
    const one = durabilitySummary([
      { startedUsing: '2026-11', confirmedMonth: '2026-11', functioning: 'with_problem', hadRepair: true },
    ]);
    const html = render(locale, one);
    expect(html).toContain(lead);
    expect(html).toContain(`<strong>1</strong> ${repair}`);
    expect(html).not.toMatch(/1 (relatos|reports|experiencias)/);
  });
});
