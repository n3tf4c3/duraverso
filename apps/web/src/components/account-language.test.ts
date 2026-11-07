import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactElement } from 'react';
const mocks = vi.hoisted(() => ({ connected: vi.fn() }));
vi.mock('@/lib/env', () => ({ isConnected: mocks.connected }));
vi.mock('@/components/connected-account', () => ({
  default: function ConnectedAccount() {
    return null;
  },
}));
vi.mock('@/components/support-page', () => ({
  SupportPage: function SupportPage() {
    return null;
  },
}));
vi.mock('@/lib/locale-page', () => ({ pageLocale: vi.fn() }));
import ConnectedAccount from '@/components/connected-account';
import { SupportPage } from '@/components/support-page';
import AccountPage from '@/app/[locale]/conta/page';

const props = { params: Promise.resolve({ locale: 'en' }), searchParams: Promise.resolve({}) } as Parameters<
  typeof AccountPage
>[0];
beforeEach(() => vi.clearAllMocks());

describe('idioma da conta conectada (achado #3)', () => {
  it('em /en e /es, o trecho operacional em português declara lang="pt-BR"', () => {
    mocks.connected.mockReturnValue(true);
    const element = AccountPage(props) as ReactElement<{ lang?: string; children?: unknown }>;
    expect(element.props.lang).toBe('pt-BR');
    const child = element.props.children;
    expect(isValidElement(child) && child.type).toBe(ConnectedAccount);
  });
  it('a prévia traduzida continua sem marcação extra', () => {
    mocks.connected.mockReturnValue(false);
    const element = AccountPage(props) as ReactElement<{ lang?: string }>;
    expect(element.type).toBe(SupportPage);
    expect(element.props.lang).toBeUndefined();
  });
});
