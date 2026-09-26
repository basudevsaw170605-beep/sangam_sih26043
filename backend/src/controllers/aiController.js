import { asyncHandler } from '../utils/helpers.js';
export const analyzeChallenge = asyncHandler(async (req, res) => {
  if (!process.env.AI_SERVICE_URL)
    return res.status(503).json({ success: false, message: 'AI analysis unavailable' });
  try {
    const response = await fetch(`${process.env.AI_SERVICE_URL}/analyze-challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw Error('AI service response failed');
    res.json({ success: true, data: await response.json() });
  } catch {
    res.status(503).json({ success: false, message: 'AI analysis unavailable' });
  }
});
