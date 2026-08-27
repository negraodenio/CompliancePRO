import { Router, Request, Response } from 'express';
import { buildCGAGSpecification, cgagSpecificationToMarkdown } from '../../core/cg-ag-controls';

export const standardRouter = Router();

/**
 * GET /api/v1/standard
 * Exposes the official CG-AG 24/12 controls standard in JSON or Markdown.
 */
standardRouter.get('/', (req: Request, res: Response) => {
  const format = req.query.format as string;
  const spec = buildCGAGSpecification();

  if (format === 'md' || format === 'markdown') {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.status(200).send(cgagSpecificationToMarkdown(spec));
  }

  return res.status(200).json({
    ok: true,
    data: spec
  });
});
