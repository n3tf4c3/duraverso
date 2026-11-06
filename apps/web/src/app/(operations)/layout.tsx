import { SiteShell } from '@/components/site-shell';
import { fontClasses } from '@/lib/fonts';
import '../globals.css';
export const metadata = { title: { default: 'Duraverso', template: '%s | Duraverso' }, robots: { index: false, follow: false } };
export default function OperationsLayout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR" className={fontClasses}><body><SiteShell operational>{children}</SiteShell></body></html>; }
