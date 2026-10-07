// In-memory mock database for cases
let cases = [
  {
    id: 'case-1001',
    name: 'Smith vs. Global Tech',
    petitioner: 'John Smith',
    respondent: 'Global Tech Ltd',
    court: 'Supreme Court',
    caseType: 'Commercial',
    status: 'Active',
    stage: 'Hearing',
    filingDate: '2025-05-12',
    nextHearing: '2026-11-15',
    lawyer: 'Jane Doe',
    client: 'John Smith',
    priority: 'High',
    lastUpdated: '2026-10-01',
    description: 'Breach of contract regarding software delivery.'
  },
  {
    id: 'case-1002',
    name: 'State vs. Cyber Syndicate',
    petitioner: 'State',
    respondent: 'Cyber Syndicate',
    court: 'High Court',
    caseType: 'Criminal',
    status: 'Pending',
    stage: 'Investigation',
    filingDate: '2026-01-20',
    nextHearing: '2026-10-25',
    lawyer: 'Robert Patel',
    client: 'State',
    priority: 'Medium',
    lastUpdated: '2026-09-15',
    description: 'Cyber fraud and data theft.'
  }
];

export const caseService = {
  getAllCases: async () => {
    return cases;
  },
  
  getCaseById: async (id: string) => {
    const caseData = cases.find(c => c.id === id);
    if (!caseData) throw new Error('Case not found');
    return caseData;
  },

  createCase: async (caseData: any) => {
    const newCase = {
      id: `case-${Math.floor(Math.random() * 10000)}`,
      ...caseData,
      status: 'Active',
      stage: 'Filed',
      filingDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    cases.push(newCase);
    return newCase;
  },
  
  updateCase: async (id: string, updates: any) => {
    const index = cases.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Case not found');
    cases[index] = { ...cases[index], ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
    return cases[index];
  },
  
  deleteCase: async (id: string) => {
    cases = cases.filter(c => c.id !== id);
    return true;
  },

  getCaseTimeline: async (id: string) => {
    // Mock timeline
    return [
      { id: 1, date: '2025-05-12', event: 'Case Filed', status: 'completed' },
      { id: 2, date: '2025-06-01', event: 'Notice Issued', status: 'completed' },
      { id: 3, date: '2025-08-15', event: 'Evidence Submitted', status: 'completed' },
      { id: 4, date: '2026-11-15', event: 'Hearing', status: 'pending' },
    ];
  },

  getCaseHearings: async (id: string) => {
    return [
      { id: 1, date: '2026-11-15', court: 'Supreme Court', judge: 'Hon. Davis', type: 'Arguments', purpose: 'Final Arguments', status: 'Scheduled', notes: 'Prepare IP evidence' }
    ];
  },

  getCaseDocuments: async (id: string) => {
    return [
      { id: 'doc-1', title: 'Initial Petition.pdf', type: 'Petition', date: '2025-05-12' },
      { id: 'doc-2', title: 'Defendant Reply.pdf', type: 'Affidavit', date: '2025-07-20' },
      { id: 'doc-3', title: 'Contract Agreement.pdf', type: 'Evidence', date: '2025-08-15' }
    ];
  }
};
