import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const mocks = vi.hoisted(() => ({ connected: vi.fn() }));
vi.mock('@/lib/env', () => ({ isConnected: mocks.connected }));
vi.mock('@/server/catalog-runtime', () => ({
  readCatalog: async () => ({ data: [], total: 13, mode: 'database_catalog' }),
}));
import { SupportPage } from './support-page';

const render = async (kind: 'regras' | 'como' | 'privacidade', locale = 'pt') =>
  renderToStaticMarkup(await SupportPage({ params: Promise.resolve({ locale }), kind }));
beforeEach(() => vi.clearAllMocks());

describe('páginas de apoio num único site em piloto fechado', () => {
  it('a prévia avisa que as contribuições ainda não estão abertas', async () => {
    mocks.connected.mockReturnValue(false);
    expect(await render('regras')).toContain('ainda não estão abertas nesta prévia');
  });
  it('no modo conectado o aviso de prévia não aparece', async () => {
    mocks.connected.mockReturnValue(true);
    expect(await render('regras')).not.toContain('nesta prévia');
  });
  it.each(['pt', 'en', 'es'])('em %s, como funciona e privacidade descrevem um único site', async (locale) => {
    mocks.connected.mockReturnValue(true);
    const html = (await render('como', locale)) + (await render('privacidade', locale));
    expect(html).not.toMatch(/prévia pública|public preview|vista previa pública|ainda não estão ativos/i);
    expect(html).toContain('netface@gmail.com');
  });
});
