import { Router, Request, Response } from 'express';
import { CodebaseAnalyzer } from '../../core/analyzer';
import { GraphOSMapper } from '../../core/graphos-mapper';

export const graphRouter = Router();

graphRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { files, scanResult, repoName = 'graph-target' } = req.body;

    let targetResult = scanResult;
    if (!targetResult && files) {
      const analyzer = new CodebaseAnalyzer();
      targetResult = await analyzer.analyze(files, repoName);
    }

    if (!targetResult) {
      return res.status(400).json({ ok: false, error: 'Provide "scanResult" or "files" map.' });
    }

    const mapper = new GraphOSMapper();
    const graphData = mapper.mapScanResult(targetResult);

    return res.status(200).json({
      ok: true,
      data: {
        entityCount: graphData.entities?.length || 0,
        relationshipCount: graphData.relationships?.length || 0,
        entities: graphData.entities,
        relationships: graphData.relationships
      }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
