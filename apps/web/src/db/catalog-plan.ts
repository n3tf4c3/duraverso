import { catalogPlan } from '../lib/catalog-plan';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--json')) {
  console.error('Uso: catalog:plan [--json]. Este comando apenas confere e exibe dados locais.');
  process.exitCode = 1;
} else {
  const plan = catalogPlan();
  if (args.includes('--json')) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(`Preparação local: ${plan.products.length} modelos; ${plan.variants.length} associações documentadas de GTIN, identificador e tensão.`);
    console.log(`Pendências: ${plan.unresolvedGtins.length} GTINs sem evidência de variante; ${plan.productsWithoutVariants.length} modelos sem variante.`);
    console.log('Cobertura limitada aos códigos do catálogo selecionado. Nenhuma gravação, migração ou ativação de avaliações.');
  }
  if (!plan.selectedCatalogCovered) process.exitCode = 1;
}
