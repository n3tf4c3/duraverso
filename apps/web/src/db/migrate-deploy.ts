if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
  throw new Error('Base local: publicação bloqueada até concluir autenticação, banco, proteção contra abuso e autorização de deploy.');
}
console.info('Base local: nenhuma migration aplicada no build.');
