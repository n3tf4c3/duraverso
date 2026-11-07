import Link from 'next/link';
import './globals.css';
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body>
        <main className="container page-space empty-state">
          <h1>404</h1>
          <p>Página não encontrada · Page not found · Página no encontrada</p>
          <Link className="button button-primary" href="/">
            Duraverso →
          </Link>
        </main>
      </body>
    </html>
  );
}
