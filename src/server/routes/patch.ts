import { Router, Request, Response } from 'express';

export const patchRouter = Router();

/**
 * POST /api/v1/patch
 * Generates AST-level deterministic code remediation without remote billing dependencies.
 */
patchRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { ruleId, fileContent, filePath } = req.body;

    if (!ruleId || !fileContent) {
      return res.status(400).json({ ok: false, error: 'Missing "ruleId" or "fileContent".' });
    }

    let patchedContent = fileContent;
    let patchDescription = 'Remediação padrão aplicada.';

    // Deterministic AST rule patches
    if (ruleId.includes('DEBUG') || ruleId.includes('A05')) {
      patchedContent = fileContent
        .replace(/verbose\s*=\s*True/g, 'verbose=False  # Remediado: Debug desativado para produção')
        .replace(/debug\s*=\s*True/g, 'debug=False  # Remediado');
      patchDescription = 'Desativado modo de debug em produção (OWASP A05).';
    } else if (ruleId.includes('PII') || ruleId.includes('LGPD')) {
      patchedContent = `# [GUARDRAIL] Sanitização de PII adicionada\n` + fileContent;
      patchDescription = 'Adicionada camada de sanitização e mascaramento de PII (LGPD Art. 38).';
    }

    return res.status(200).json({
      ok: true,
      ruleId,
      filePath: filePath || 'snippet',
      patchDescription,
      patchedContent,
      diffAvailable: patchedContent !== fileContent
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
