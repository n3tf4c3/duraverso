import { describe, expect, it } from 'vitest';
import { catalogImportOptions, catalogImportTarget } from './catalog-import-options';

describe('destino da importação', () => {
  it('consulta por padrão e exige destino explícito para aplicar', () => {
    expect(catalogImportOptions([])).toEqual({ apply: false, expectedTarget: undefined });
    expect(catalogImportOptions(['--apply', '--expect-target=db.example:5432/pilot'])).toEqual({
      apply: true,
      expectedTarget: 'db.example:5432/pilot',
    });
    for (const args of [
      ['--apply'],
      ['--expect-target=db/pilot'],
      ['--expect-target='],
      ['--force'],
      ['--apply', '--apply'],
    ]) {
      expect(() => catalogImportOptions(args)).toThrow();
    }
  });
  it('compara host, porta e banco sem incluir credenciais no relatório', () => {
    const value = 'postgresql://test-only:secret@db.example/pilot?sslmode=require';
    expect(catalogImportTarget(value)).toBe('db.example:5432/pilot');
    expect(catalogImportTarget(value, 'db.example:5432/pilot')).toBe('db.example:5432/pilot');
    expect(() => catalogImportTarget(value, 'db.example:5432/outro')).toThrow();
    expect(() => catalogImportTarget(value, 'db.example:5433/pilot')).toThrow();
  });
  it('recusa pooler, banco implícito e parâmetros que redirecionam a conexão', () => {
    for (const value of [
      undefined,
      'invalid',
      'https://db.example/pilot',
      'postgres://db-pooler.example/pilot',
      'postgres://db.example/',
      'postgres://db.example/pilot?host=outro',
      'postgres://db.example/pilot?dbname=outro',
      'postgres://db.example/pilot?options=-csearch_path%3Doutro',
    ]) {
      expect(() => catalogImportTarget(value)).toThrow();
    }
  });
});
