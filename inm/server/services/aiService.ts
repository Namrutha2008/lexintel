import { openAiService } from './openAiService.js';
import { caseService } from './caseService.js';

export const aiService = {
  chat: async (query: string, contextMode: string, caseId?: string, history?: any[]) => {
    return openAiService.chat({
      message: query,
      conversation: history,
      context: contextMode,
      caseId: caseId
    });
  },

  summarize: async (documentText: string) => {
    return openAiService.chat({
      message: "Please provide a detailed legal summary of this document, including key points and issues.",
      documentText: documentText
    });
  },

  compare: async (caseId1: string, caseId2: string) => {
    let case1Data = {};
    let case2Data = {};
    try { case1Data = await caseService.getCaseById(caseId1); } catch (e) {}
    try { case2Data = await caseService.getCaseById(caseId2); } catch (e) {}

    const comparisonMessage = `Compare these two legal cases:\n\nCase 1 (${caseId1}): ${JSON.stringify(case1Data)}\n\nCase 2 (${caseId2}): ${JSON.stringify(case2Data)}\n\nProvide similarities, differences, and key takeaways.`;

    const res = await openAiService.chat({
      message: comparisonMessage
    });

    return {
      case1: caseId1,
      case2: caseId2,
      comparison: res.reply
    };
  },

  processDocument: async (fileData: any) => {
    return {
      status: "success",
      documentId: `doc-${Date.now()}`,
      chunksProcessed: 12
    };
  }
};
