import { Router, Request, Response } from 'express';
import { CodebaseAnalyzer } from '../../core/analyzer';
import { SecurityGuard } from '../../core/security';
import * as fs from 'fs';
import * as path from 'path';

export const scanRouter = Router();

scanRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { files, directoryPath, repoName } = req.body;

    let fileMap: Record<string, string> = {};

    if (files && typeof files === 'object') {
      fileMap = files;
    } else if (directoryPath) {
      const safeDir = SecurityGuard.resolveSafePath(directoryPath);
      if (!fs.existsSync(safeDir)) {
        return res.status(404).json({ ok: false, error: `Directory not found: ${directoryPath}` });
      }

      function readRecursive(dir: string, base: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '__pycache__') continue;
          const full = path.join(dir, entry.name);
          const rel = path.relative(base, full).replace(/\\/g, '/');
          if (entry.isDirectory()) {
            readRecursive(full, base);
          } else if (entry.isFile() && /\.(py|js|ts|tsx|jsx|ipynb|json|ya?ml)$/i.test(entry.name)) {
            try {
              fileMap[rel] = fs.readFileSync(full, 'utf-8');
            } catch { /* skip */ }
          }
        }
      }

      readRecursive(safeDir, safeDir);
    } else {
      return res.status(400).json({
        ok: false,
        error: 'Missing payload. Provide "files" { [path]: string } or "directoryPath": string'
      });
    }

    const analyzer = new CodebaseAnalyzer();
    const result = await analyzer.analyze(fileMap, repoName || 'audit-target');

    return res.status(200).json({
      ok: true,
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: SecurityGuard.sanitizeOutput(error.message || 'Internal scan error')
    });
  }
});
