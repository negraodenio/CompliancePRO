import fs from 'fs';
import path from 'path';

export interface TableSummary {
  tableName: string;
  primaryKeys: string[];
  foreignKeys: Array<{ column: string; refTable: string; refColumn: string }>;
  uniqueConstraints: string[][];
  hasTenantScope: boolean;
  hasWorkspaceScope: boolean;
  hasOCCVersion: boolean;
}

export class SchemaValidator {
  static loadSchema(schemaPath: string): string {
    return fs.readFileSync(schemaPath, 'utf-8');
  }

  static loadSeed(seedPath: string): string {
    return fs.readFileSync(seedPath, 'utf-8');
  }

  static parseTables(sql: string): TableSummary[] {
    const tableBlocks = sql.split(/CREATE TABLE IF NOT EXISTS/i).slice(1);
    const tables: TableSummary[] = [];

    for (const block of tableBlocks) {
      const matchName = block.match(/^\s*([a-zA-Z0-9_]+)\s*\(/);
      if (!matchName) continue;
      const tableName = matchName[1];

      const hasTenantScope = /tenant_id\s+VARCHAR/i.test(block);
      const hasWorkspaceScope = /workspace_id\s+VARCHAR/i.test(block);
      const hasOCCVersion = /version\s+INT/i.test(block);

      const pkMatch = block.match(/PRIMARY KEY\s*\(([^)]+)\)/i);
      const primaryKeys = pkMatch ? pkMatch[1].split(',').map(s => s.trim()) : [];

      const fkMatches = [...block.matchAll(/FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s*([a-zA-Z0-9_]+)\s*\(([^)]+)\)/gi)];
      const foreignKeys = fkMatches.map(m => ({
        column: m[1].trim(),
        refTable: m[2].trim(),
        refColumn: m[3].trim()
      }));

      const uniqueMatches = [...block.matchAll(/UNIQUE\s*\(([^)]+)\)/gi)];
      const uniqueConstraints = uniqueMatches.map(m => m[1].split(',').map(s => s.trim()));

      tables.push({
        tableName,
        primaryKeys,
        foreignKeys,
        uniqueConstraints,
        hasTenantScope,
        hasWorkspaceScope,
        hasOCCVersion
      });
    }

    return tables;
  }
}
