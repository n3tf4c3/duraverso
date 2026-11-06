import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const mocks = vi.hoisted(() => ({ connected: vi.fn(), actor: vi.fn(), database: vi.fn(), read: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/env', () => ({ isConnected: mocks.connected }));
vi.mock('@/auth', () => ({ currentActor: mocks.actor }));
vi.mock('@/server/database', () => ({ database: mocks.database }));
vi.mock('@/server/catalog-admin', () => ({ CatalogAdminService: class { read = mocks.read; } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
import CatalogAdminPage from '@/app/admin/catalogo/page';

beforeEach(() => { vi.clearAllMocks(); mocks.connected.mockReturnValue(true); });
describe('renderização da revisão do catálogo', () => {
  it('a prévia não consulta sessão nem banco e não apresenta ações', async () => {
    mocks.connected.mockReturnValue(false);
    const html = renderToStaticMarkup(await CatalogAdminPage());
    expect(html).toContain('desativada nesta prévia'); expect(html).not.toContain('<form');
    expect(mocks.actor).not.toHaveBeenCalled(); expect(mocks.database).not.toHaveBeenCalled();
  });
  it.each([null, { role: 'member' }, { role: 'moderator' }])('oculta catálogo para ator sem autorização: %j', async (actor) => {
    mocks.actor.mockResolvedValue(actor);
    const html = renderToStaticMarkup(await CatalogAdminPage());
    expect(html).toContain('Acesso restrito'); expect(html).not.toContain('<form');
    expect(mocks.read).not.toHaveBeenCalled(); expect(mocks.database).not.toHaveBeenCalled();
  });
  it('mostra indisponibilidade sanitizada sem confundir com catálogo vazio', async () => {
    mocks.actor.mockResolvedValue({ role: 'admin' }); mocks.read.mockRejectedValue(new Error('database-password-secret'));
    const html = renderToStaticMarkup(await CatalogAdminPage());
    expect(html).toContain('temporariamente indisponível'); expect(html).not.toContain('database-password');
    expect(html).not.toContain('Nenhum modelo importado');
  });
  it('renderiza evidências, estado e histórico sem transformar fonte insegura em link', async () => {
    mocks.actor.mockResolvedValue({ role: 'admin' });
    mocks.read.mockResolvedValue([{ token: 'a'.repeat(32), product: { id: '00000000-0000-4000-8000-000000000001',
      slug: 'fixture', brand: 'Consul', model: 'Fixture', capacityKg: 9, verified: false, revision: 0,
      sourceUrl: 'javascript:alert(1)', sourceCheckedAt: '2026-01-01', variants: [] }, history: [] }]);
    const html = renderToStaticMarkup(await CatalogAdminPage());
    expect(html).toContain('Consul'); expect(html).toContain('referência de catálogo não comprova uma revisão física');
    expect(html).toContain('fonte HTTPS ausente ou inválida'); expect(html).not.toContain('href="javascript:');
    expect(html).toContain('disabled=""'); expect(html).toContain('Nenhuma decisão registrada');
  });
});
