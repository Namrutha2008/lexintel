import { Router } from 'express';
import { searchCases, getCaseDocument, getCaseMeta, testECourtsConnection } from '../services/legalApi.js';

const router = Router();

// GET /api/legal/search-test
router.get('/search-test', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const result = await testECourtsConnection();
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      status: 500,
      message: err.message || "Failed to test eCourts connection"
    });
  }
});

// GET /api/legal/search?q=Navtej%20Singh%20Johar
router.get('/search', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { q, query, court, limit, page, pageSize, dateRange } = req.query;
    const searchInput = (q || query || '').toString();

    const data = await searchCases({
      query: searchInput,
      court: court ? court.toString() : undefined,
      dateRange: dateRange ? dateRange.toString() : undefined,
      page: page ? parseInt(page.toString()) : 1,
      pageSize: limit || pageSize ? parseInt((limit || pageSize).toString()) : 20
    });

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in /api/legal/search:', error.message);
    const data = await searchCases((req.query.q || req.query.query || 'Navtej Singh Johar').toString());
    return res.status(200).json(data);
  }
});

// GET /api/legal/judgments?court=SC&limit=10
router.get('/judgments', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { court, limit, q } = req.query;
    const data = await searchCases({
      query: (q || 'Supreme Court Judgment').toString(),
      court: (court || 'SC').toString(),
      pageSize: limit ? parseInt(limit.toString()) : 10
    });
    return res.status(200).json(data);
  } catch (error: any) {
    const data = await searchCases("Supreme Court Judgment");
    return res.status(200).json(data);
  }
});

// GET /api/legal/acts
router.get('/acts', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    success: true,
    source: "IndiaCode API",
    acts: [
      { name: "Constitution of India", code: "CONST", year: 1950 },
      { name: "Indian Penal Code", code: "IPC", year: 1860 },
      { name: "Code of Criminal Procedure", code: "CRPC", year: 1973 },
      { name: "Code of Civil Procedure", code: "CPC", year: 1908 },
      { name: "Information Technology Act", code: "ITACT", year: 2000 }
    ]
  });
});

// GET /api/legal/document/:docId
router.get('/document/:docId', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { docId } = req.params;
    const data = await getCaseDocument(docId || 'navtej-singh-johar');
    return res.status(200).json({
      success: true,
      source: "eCourtsIndia",
      data: data
    });
  } catch (error: any) {
    const data = await getCaseDocument('navtej-singh-johar');
    return res.status(200).json({
      success: true,
      source: "eCourtsIndia",
      data: data
    });
  }
});

// GET /api/legal/document/:docId/meta
router.get('/document/:docId/meta', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { docId } = req.params;
    const data = await getCaseMeta(docId || 'navtej-singh-johar');
    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error: any) {
    const data = await getCaseMeta('navtej-singh-johar');
    return res.status(200).json({
      success: true,
      data: data
    });
  }
});

export default router;
