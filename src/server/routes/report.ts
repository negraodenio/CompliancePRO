import { Router, Request, Response } from 'express';
import { GovernanceReportGenerator } from '../../core/report-generator';
import { CodebaseAnalyzer } from '../../core/analyzer';

export const reportRouter = Router();

reportRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { scanResult, files, type = 'ripd', organizationName, projectName, dpoName } = req.body;

    let targetResult = scanResult;

    if (!targetResult && files) {
      const analyzer = new CodebaseAnalyzer();
      targetResult = await analyzer.analyze(files, projectName || 'report-target');
    }

    if (!targetResult) {
      return res.status(400).json({ ok: false, error: 'Provide "scanResult" object or "files" map.' });
    }

    let reportMarkdown = '';
    const opts = { organizationName, projectName, dpoName };

    switch (type.toLowerCase()) {
      case 'eu-ai-act':
      case 'annex-iv':
        reportMarkdown = GovernanceReportGenerator.generateEUAIActAnnexIV(targetResult, opts);
        break;
      case 'executive':
        reportMarkdown = GovernanceReportGenerator.generateExecutiveSummary(targetResult, opts);
        break;
      case 'ripd':
      default:
        reportMarkdown = GovernanceReportGenerator.generateRIPD(targetResult, opts);
        break;
    }

    return res.status(200).json({
      ok: true,
      reportType: type,
      format: 'markdown',
      content: reportMarkdown
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
