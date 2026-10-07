// Mock Document Processing API
export const documentService = {
  getDocument: async (documentId: string) => {
    return {
      title: "Judgment - SC-2023-104",
      content: `[Paragraph 1] The present appeal arises out of the judgment delivered by the High Court...
      
[Paragraph 2] The core issue in this case pertains to section 4 of the Data Protection Act...

[Paragraph 3] We find that the contractor failed to implement reasonable security practices...

[Paragraph 4] Therefore, the appeal is allowed and the judgment of the High Court is set aside.`
    };
  },
  
  downloadDocument: async (documentId: string) => {
    console.log(`Downloading document ${documentId}...`);
  }
};
