import { Router, Request, Response } from 'express';
import { CodebaseAnalyzer } from '../../core/analyzer';
import { AgenticLightAssessment } from '../../core/agentic-light';
import { AgentPassportGenerator } from '../../core/agent-passport';

export const agenticRouter = Router();

/**
 * POST /api/v1/agentic/light
 * Executes the 10-Dimension Rapid Agent Governance Assessment.
 */
agenticRouter.post('/light', async (req: Request, res: Response) => {
  try {
    const { files, scanResult, repoName = 'agentic-target', format } = req.body;

    let targetResult = scanResult;
    if (!targetResult && files) {
      const analyzer = new CodebaseAnalyzer();
      targetResult = await analyzer.analyze(files, repoName);
    }

    if (!targetResult) {
      return res.status(400).json({ ok: false, error: 'Provide "scanResult" or "files" payload.' });
    }

    const assessment = AgenticLightAssessment.assess(targetResult);

    if (format === 'md' || format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      return res.status(200).send(AgenticLightAssessment.toMarkdown(assessment));
    }

    return res.status(200).json({
      ok: true,
      data: assessment
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/v1/agentic/passports
 * Emits the Agent Governance Passports for all detected agents.
 */
agenticRouter.post('/passports', async (req: Request, res: Response) => {
  try {
    const { files, scanResult, repoName = 'passport-target', format } = req.body;

    let targetResult = scanResult;
    if (!targetResult && files) {
      const analyzer = new CodebaseAnalyzer();
      targetResult = await analyzer.analyze(files, repoName);
    }

    if (!targetResult) {
      return res.status(400).json({ ok: false, error: 'Provide "scanResult" or "files" payload.' });
    }

    const agents = targetResult.source?.agents || [];
    const passports = agents.map(a => AgentPassportGenerator.generatePassport(a, repoName, targetResult.violations));

    if (format === 'md' || format === 'markdown') {
      const mdOutput = passports.map(p => AgentPassportGenerator.toMarkdown(p)).join('\n\n---\n\n');
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      return res.status(200).send(mdOutput);
    }

    return res.status(200).json({
      ok: true,
      totalPassports: passports.length,
      data: passports
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
