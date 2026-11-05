import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Infinity as InfinityIcon, UserRound } from 'lucide-react';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Duraverso — Histórias reais. Escolhas que duram.', template: '%s | Duraverso' }, description: 'Conheça os produtos pela experiência de quem usa. Catálogo inicial de lavadoras, relatos e histórico de funcionamento.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
    <header className="site-header"><div className="container header-inner"><Link href="/" className="brand" aria-label="Duraverso, início"><span className="brand-mark"><InfinityIcon size={29} strokeWidth={2.4} /></span>duraverso<span className="brand-period">.</span></Link><nav aria-label="Navegação principal"><Link href="/produtos">Explorar produtos</Link><Link href="/como-funciona">Como funciona</Link></nav><Link href="/conta" className="account-link" aria-label="Minha conta"><UserRound size={17} /><span>Minha conta</span></Link></div></header>
    <main id="conteudo">{children}</main>
    <footer className="site-footer"><div className="container footer-top"><div><Link href="/" className="brand"><span className="brand-mark"><InfinityIcon size={25} /></span>duraverso.</Link><p>O valor de um produto também está<br />na história de quem usa.</p></div><div className="footer-links"><Link href="/como-funciona">Como funciona <ArrowUpRight size={14} /></Link><Link href="/regras">Regras da comunidade</Link><Link href="/privacidade">Privacidade</Link><Link href="/admin">Administração</Link></div></div><div className="container footer-bottom"><span>Feito para histórias que duram.</span><span>Piloto · Lavadoras · Prévia local</span></div></footer>
  </body></html>;
}
