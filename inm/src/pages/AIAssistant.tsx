import React, { useState, useRef, useEffect } from 'react';
import { 
  BrainCircuit, Send, Square, Copy, Check, RefreshCw, Paperclip, 
  Trash2, MessageSquare, Plus, FileText, Scale, Info, ChevronDown,
  ShieldAlert, AlertCircle, X, FileCheck, FolderOpen, Clock, Calendar
} from 'lucide-react';
import { unzipSync, strFromU8 } from 'fflate';
import AI3DVisualization from '../components/AI3DVisualization';

export default function AIAssistant({ caseId }: { caseId?: string }) {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState(caseId ? 'Selected Case' : 'General Legal Research');
  const [conversations, setConversations] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadedDocText, setUploadedDocText] = useState<string | null>(null);
  const [casesList, setCasesList] = useState<any[]>([
    { id: 'case-1001', name: 'Smith vs. Global Tech', court: 'Supreme Court', caseType: 'Commercial', status: 'Active', stage: 'Hearing', filingDate: '2025-05-12', nextHearing: '2026-11-15', priority: 'High', lawyer: 'Jane Doe', description: 'Breach of contract regarding software delivery.' },
    { id: 'case-1002', name: 'State vs. Cyber Syndicate', court: 'High Court', caseType: 'Criminal', status: 'Pending', stage: 'Investigation', filingDate: '2026-01-20', nextHearing: '2026-10-25', priority: 'Medium', lawyer: 'Robert Patel', description: 'Cyber fraud and data theft.' }
  ]);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter out any binary, zip headers, or unprintable gibberish
  const cleanExtractedDocumentText = (raw: string): string => {
    if (!raw) return "";

    // 1. If text contains docx XML tags, extract text from <w:t> tags
    if (raw.includes('<w:t') || raw.includes('</w:t>')) {
      const xmlMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/gi);
      if (xmlMatches && xmlMatches.length > 0) {
        const extracted = xmlMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ');
        if (extracted.length > 10) return extracted;
      }
    }

    // 2. Filter out raw zip archives, xml manifests, and binary junk
    const rawLines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const validLines: string[] = [];

    for (const line of rawLines) {
      // Discard zip manifests / XML headers
      if (
        line.includes('[Content_Types].xml') || 
        line.includes('_rels') || 
        line.includes('openxmlformats') ||
        line.includes('word/document.xml') ||
        line.startsWith('PK') ||
        line.includes('PK\x03\x04') ||
        line.startsWith('<?xml')
      ) {
        continue;
      }

      // Remove replacement character and non-printable control characters
      const sanitized = line.replace(/[\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '').trim();
      
      // Calculate ratio of standard printable characters
      const printableWords = sanitized.match(/[A-Za-z0-9]{2,}/g);
      const totalLettersAndDigits = (sanitized.match(/[A-Za-z0-9]/g) || []).length;

      // Only keep lines that have actual readable words
      if (sanitized.length > 3 && printableWords && printableWords.length >= 1 && totalLettersAndDigits / sanitized.length > 0.4) {
        validLines.push(sanitized);
      }
    }

    if (validLines.length > 0) {
      return validLines.join('\n');
    }

    // Fallback: extract any readable words of 3+ letters
    const wordMatches = raw.match(/[A-Za-z0-9\s.,;:'"()\-–—\/]{4,}/g);
    if (wordMatches && wordMatches.length > 0) {
      const extractedWords = wordMatches.map(w => w.trim()).filter(w => /[a-zA-Z]{3,}/.test(w)).join(' ');
      if (extractedWords.length > 30) {
        return extractedWords;
      }
    }

    return "";
  };

  // Helper to extract clean text from any file type (.docx, .doc, .pdf, .txt, .md)
  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();

    // 1. DOCX / Word Document handling using fflate
    if (fileName.endsWith('.docx') || file.type.includes('wordprocessingml') || file.type.includes('docx') || file.type.includes('application/zip')) {
      try {
        const buffer = await file.arrayBuffer();
        const unzipped = unzipSync(new Uint8Array(buffer));
        let docXmlBytes = unzipped['word/document.xml'];
        if (!docXmlBytes) {
          const key = Object.keys(unzipped).find(k => k.endsWith('document.xml'));
          if (key) docXmlBytes = unzipped[key];
        }
        if (docXmlBytes) {
          const docXml = strFromU8(docXmlBytes);
          const formatted = docXml
            .replace(/<\/w:p>/gi, '\n')
            .replace(/<w:br[^>]*>/gi, '\n')
            .replace(/<w:tab[^>]*>/gi, ' ')
            .replace(/<[^>]+>/g, '');
          const cleaned = formatted
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(Boolean)
            .join('\n');
          if (cleaned.length > 10) {
            return cleaned;
          }
        }
      } catch (err) {
        console.warn("fflate docx unzipping error:", err);
      }
    }

    // 2. Read as array buffer to check for zip or binary headers
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // If starts with PK (0x50, 0x4B), it's a zip/docx archive!
      if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
        try {
          const unzipped = unzipSync(bytes);
          const docKey = Object.keys(unzipped).find(k => k.includes('document.xml'));
          if (docKey && unzipped[docKey]) {
            const docXml = strFromU8(unzipped[docKey]);
            const text = docXml.replace(/<\/w:p>/gi, '\n').replace(/<[^>]+>/g, '').trim();
            if (text.length > 10) return text;
          }
        } catch (e) {}
      }

      // Try decoding utf-8
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      const cleaned = cleanExtractedDocumentText(decoded);
      if (cleaned.length > 20) return cleaned;
    } catch (err) {
      console.warn("ArrayBuffer extraction error:", err);
    }

    // 3. Fallback for text files
    try {
      const text = await file.text();
      const sanitized = cleanExtractedDocumentText(text);
      if (sanitized.length > 20) return sanitized;
    } catch (e) {}

    return `[Document: ${file.name}]\nDocument format: ${file.type || 'Word Document'}\nSize: ${(file.size / 1024).toFixed(1)} KB`;
  };

  // Structured, detailed document summarization
  const generateDocumentSummary = (docText: string, docName?: string): string => {
    if (!docText || !docText.trim()) {
      return "### 📄 Document Summary\n\nNo document content detected to summarize. Please upload a valid document or provide text.";
    }

    let clean = cleanExtractedDocumentText(docText).trim();
    if (!clean) clean = docText.trim();
    const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const words = clean.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    let detectedTitle = docName || "Uploaded Legal Document";
    if (lines.length > 0 && lines[0].length < 120 && !lines[0].startsWith('{') && !lines[0].startsWith('---')) {
      detectedTitle = lines[0].replace(/^#+\s*/, '');
    }

    const lower = clean.toLowerCase();
    let docType = "General Legal Document";
    if (lower.includes("employment agreement") || lower.includes("employment contract") || lower.includes("offer letter")) {
      docType = "Employment & Service Agreement";
    } else if (lower.includes("non-disclosure") || lower.includes("nda") || lower.includes("confidentiality")) {
      docType = "Non-Disclosure / Confidentiality Agreement";
    } else if (lower.includes("lease agreement") || lower.includes("tenancy agreement")) {
      docType = "Lease & Tenancy Agreement";
    } else if (lower.includes("writ petition") || lower.includes("civil appeal") || lower.includes("special leave petition") || lower.includes("slp")) {
      docType = "Court Petition / Pleading";
    } else if (lower.includes("judgment") || lower.includes("order") || lower.includes("hon'ble court") || lower.includes("versus") || lower.includes(" v. ")) {
      docType = "Judicial Judgment / Court Order";
    } else if (lower.includes("legal notice") || lower.includes("demand notice")) {
      docType = "Legal Notice / Demand";
    } else if (lower.includes("affidavit")) {
      docType = "Sworn Affidavit";
    } else if (lower.includes("agreement") || lower.includes("contract")) {
      docType = "Commercial Contract / Agreement";
    }

    let detectedParties = "Not explicitly stated or multiple entities referenced";
    const partyMatch1 = clean.match(/(?:between|BETWEEN)\s*[:\n\r]*([^\n\r]+?)(?:\s*(?:and|AND)\s*)([^\n\r]+?)(?:\.|\n|\r|hereinafter)/i);
    const vsMatch = clean.match(/([A-Z][A-Za-z0-9\s.,&]+)\s+(?:versus|vs\.?|v\.)\s+([A-Z][A-Za-z0-9\s.,&]+)/i);
    if (partyMatch1) {
      detectedParties = `Party 1: ${partyMatch1[1].trim()} | Party 2: ${partyMatch1[2].trim()}`;
    } else if (vsMatch) {
      detectedParties = `Petitioner/Plaintiff: ${vsMatch[1].trim()} vs. Respondent/Defendant: ${vsMatch[2].trim()}`;
    }

    let governingLaw = "Indian Statutory Law & Jurisdiction";
    const govMatch = clean.match(/governed by (?:the )?(?:laws of )?([^\n\r,.;]+)/i) || clean.match(/jurisdiction of (?:the )?(?:courts (?:at|in) )?([^\n\r,.;]+)/i);
    if (govMatch) {
      governingLaw = govMatch[1].trim();
    }

    const keyProvisions: string[] = [];
    for (const line of lines) {
      if (/^(clause|section|article|\d+[\.\)]|[ivxlcdm]+[\.\)])\s+/i.test(line) && line.length > 25 && line.length < 300) {
        if (keyProvisions.length < 5) keyProvisions.push(line);
      }
    }

    const paragraphs = clean.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 50);
    const overviewSnippet = paragraphs.slice(0, 2).join(' ').substring(0, 500) || lines.slice(0, 6).join(' ').substring(0, 500);

    const risks: string[] = [];
    if (lower.includes("terminate") || lower.includes("termination")) risks.push("Contains explicit unilateral termination and notice requirements.");
    if (lower.includes("indemnif") || lower.includes("liability")) risks.push("Includes indemnification and limitation of liability obligations.");
    if (lower.includes("confidential") || lower.includes("proprietary")) risks.push("Imposes binding confidentiality and non-disclosure covenants.");
    if (lower.includes("arbitrat") || lower.includes("dispute")) risks.push("Mandates specific dispute resolution / arbitration seat and procedures.");
    if (lower.includes("penalty") || lower.includes("liquidated damages") || lower.includes("forfeit")) risks.push("Prescribes financial penalties or liquidated damages upon default.");
    if (risks.length === 0) risks.push("Standard statutory compliance obligations apply under applicable legislation.");

    return `### 📄 Executive Summary & Legal Analysis

**Document**: ${detectedTitle}  
**Classification**: \`${docType}\`  
**Document Size**: ~${wordCount} words (${lines.length} lines)

---

#### 📌 Executive Overview
${overviewSnippet}${overviewSnippet.length >= 500 ? '...' : ''}

#### ⚖️ Key Parties & Jurisdiction
- **Parties Identified**: ${detectedParties}
- **Governing Jurisdiction / Forum**: ${governingLaw}

#### 🔍 Core Clauses & Highlights
${keyProvisions.length > 0 
  ? keyProvisions.map((prov, i) => `${i + 1}. ${prov}`).join('\n') 
  : `1. **Primary Covenant / Purpose**: Sets forth binding legal terms, considerations, and representations between parties.\n2. **Performance & Compliance**: Mandates timely performance subject to standard legal warranties.\n3. **Remedies & Breach**: Establishes rights of recourse upon non-performance or material breach.`}

#### ⚠️ Risk Assessment & Compliance Flags
${risks.map((r, i) => `- **Point ${i + 1}**: ${r}`).join('\n')}

#### 🚀 Recommended Actionable Next Steps
1. **Clause Verification**: Confirm execution dates, authorized signatories, and timestamp validity.
2. **Statutory Adherence**: Ensure adherence to the Indian Contract Act (1872) or applicable procedural statutes.
3. **Dispute Safeguards**: Verify that dispute escalation and notice periods are strictly adhered to before taking judicial recourse.

---
*LexIntel AI Legal Intelligence • Prepared for advocates and legal teams.*`;
  };

  const generateLocalAiReply = (prompt: string, docContext?: string, docName?: string): string => {
    const p = prompt.trim().toLowerCase();

    // 1. Case Management Queries (Active cases, pending cases, case counts, etc.)
    const isCaseManagementQuery = 
      p.includes('active case') || 
      p.includes('pending case') || 
      p.includes('closed case') || 
      p.includes('how many case') || 
      p.includes('my cases') || 
      p.includes('case status') || 
      p.includes('case management') ||
      p.includes('next hearing') ||
      p.includes('upcoming hearing') ||
      p.includes('smith vs') ||
      p.includes('cyber syndicate');

    if (isCaseManagementQuery) {
      const activeCases = casesList.filter(c => c.status?.toLowerCase() === 'active');
      const pendingCases = casesList.filter(c => c.status?.toLowerCase() === 'pending');
      const closedCases = casesList.filter(c => c.status?.toLowerCase() === 'closed');

      if (p.includes('active')) {
        return `### 📂 Active Cases Portfolio (Case Management)\n\nYou currently have **${activeCases.length} Active Case${activeCases.length === 1 ? '' : 's'}**:\n\n${activeCases.map((c, i) => `\n**${i + 1}. ${c.name}** (\`${c.id}\`)\n- **Court**: ${c.court}\n- **Stage**: ${c.stage || 'Hearing'}\n- **Priority**: ${c.priority || 'High'} 🔴\n- **Next Hearing Date**: 📅 **${c.nextHearing || 'Not scheduled'}**\n- **Parties**: ${c.petitioner || 'Petitioner'} vs. ${c.respondent || 'Respondent'}\n- **Lead Counsel**: ${c.lawyer || 'Assigned Counsel'}\n- **Summary**: ${c.description || 'Commercial breach of contract dispute.'}\n`).join('\n')}\n\n---\n📊 **Litigation Snapshot**: **${activeCases.length}** Active | **${pendingCases.length}** Pending | **${closedCases.length}** Closed (Total: **${casesList.length}** Cases).`;
      }

      if (p.includes('pending')) {
        return `### ⏳ Pending Cases Portfolio (Case Management)\n\nYou currently have **${pendingCases.length} Pending Case${pendingCases.length === 1 ? '' : 's'}**:\n\n${pendingCases.map((c, i) => `\n**${i + 1}. ${c.name}** (\`${c.id}\`)\n- **Court**: ${c.court}\n- **Stage**: ${c.stage || 'Investigation'}\n- **Priority**: ${c.priority || 'Medium'} 🟡\n- **Next Hearing Date**: 📅 **${c.nextHearing || 'Not scheduled'}**\n- **Parties**: ${c.petitioner || 'State'} vs. ${c.respondent || 'Accused'}\n- **Lead Counsel**: ${c.lawyer || 'Assigned Counsel'}\n- **Summary**: ${c.description || 'Cyber fraud and data theft investigation.'}\n`).join('\n')}\n\n---\n📊 **Litigation Snapshot**: **${activeCases.length}** Active | **${pendingCases.length}** Pending | **${closedCases.length}** Closed (Total: **${casesList.length}** Cases).`;
      }

      if (p.includes('hearing')) {
        const scheduledHearings = casesList.filter(c => c.nextHearing);
        return `### 📅 Upcoming Hearings Schedule (Case Management)\n\nYou have **${scheduledHearings.length}** scheduled hearings:\n\n${scheduledHearings.map((c, i) => `\n${i + 1}. 📅 **${c.nextHearing}** — **${c.name}** (\`${c.id}\`)\n   - **Court**: ${c.court}\n   - **Stage**: ${c.stage || 'Hearing'}\n   - **Status**: \`${c.status}\` | **Priority**: ${c.priority || 'Medium'}\n   - **Counsel**: ${c.lawyer || 'Assigned Counsel'}\n`).join('\n')}\n\n💡 *Action item: Prepare IP evidence and submission briefs 48 hours prior to hearing dates.*`;
      }

      return `### 📊 Litigation Portfolio Overview (Case Management)\n\nHere is your complete case overview from the **Case Management** dashboard:\n\n| Case ID | Case Title | Court | Status | Stage | Priority | Next Hearing |\n|---|---|---|---|---|---|---|\n${casesList.map(c => `| \`${c.id}\` | **${c.name}** | ${c.court} | \`${c.status}\` | ${c.stage || 'N/A'} | ${c.priority || 'Medium'} | 📅 ${c.nextHearing || 'N/A'} |`).join('\n')}\n\n#### 📌 Key Metrics:\n- **Total Cases**: **${casesList.length}**\n- 🔴 **Active Cases**: **${activeCases.length}** (*${activeCases.map(c => c.name).join(', ')}*)\n- 🟡 **Pending Cases**: **${pendingCases.length}** (*${pendingCases.map(c => c.name).join(', ')}*)\n- 🟢 **Closed Cases**: **${closedCases.length}**\n\nYou can ask me to dive deeper into any specific case, view its timeline, or analyze connected documents!`;
    }

    // 2. Greetings (e.g. "hi", "hello", "hey", etc.)
    const isGreeting = /^(hi|hello|hey|greetings|namaste|good\s*(morning|afternoon|evening|day)|yo|howdy)(\s|!|\?|$)/i.test(prompt.trim());
    if (isGreeting) {
      if (docContext && docContext.trim()) {
        return `Hello! 👋 I have **${docName || 'your uploaded document'}** loaded and ready for analysis.\n\nHere is how I can assist you:\n- **Summarize the document** (type "summarize" or click below)\n- **Extract key clauses & obligations**\n- **Flag legal risks & liabilities**\n- **Answer specific questions** about any section\n\nWhat would you like me to do with this document?`;
      }
      const activeCount = casesList.filter(c => c.status?.toLowerCase() === 'active').length;
      const pendingCount = casesList.filter(c => c.status?.toLowerCase() === 'pending').length;
      return `Hello! 👋 I am your **LexIntel AI Legal Assistant**.\n\nHere is a quick snapshot of your workspace:\n- 📂 **Case Management**: You currently have **${activeCount} Active Case${activeCount === 1 ? '' : 's'}** and **${pendingCount} Pending Case${pendingCount === 1 ? '' : 's'}**.\n- 📄 **Document Summarization**: Upload any document (.txt, .md, .pdf) using the 📎 button to get an instant executive summary and risk analysis.\n- ⚖️ **Legal Research**: Ask about Indian constitutional law, statutes (IPC, CrPC, CPC, BNS), or landmark precedents.\n\nHow can I help you today? You can ask *"How many active cases do I have?"* or upload a document!`;
    }

    // 2. Help / Commands
    if (/^(help|commands|what can you do|capabilities|options)(\s|!|\?|$)/i.test(prompt.trim())) {
      return `### 🤖 LexIntel AI Commands & Capabilities\n\n| Command / Action | Description |\n|---|---|\n| \`hi\` / \`hello\` | Friendly greeting and assistant overview |\n| \`summarize\` | Generates executive summary of active document or case |\n| \`key clauses\` | Extracts core clauses, obligations, and covenants |\n| \`risks\` | Flags legal vulnerabilities, penalties, and termination risks |\n| \`precedents\` | Retrieves relevant Supreme Court & High Court case law |\n| 📎 **Upload File** | Ingests \`.txt\`, \`.md\`, \`.pdf\`, \`.doc\` files and auto-summarizes them |\n\nYou can also ask any legal question such as *"What is Article 21?"* or *"Explain anticipatory bail under Indian law"*!`;
    }

    // 3. Identity / Who are you
    if (/^(who are you|what is lexintel|who made you)(\s|!|\?|$)/i.test(prompt.trim())) {
      return `I am **LexIntel AI**, an intelligent legal research and document analysis assistant built specifically for advocates, legal scholars, and researchers. I synthesize Indian statutory law, landmark Supreme Court / High Court precedents, and case documents to provide high-accuracy legal summaries and actionable insights.`;
    }

    // 4. Document Summarization
    const isSummarizeRequest = p.includes('summarize') || p.includes('summary') || p.includes('overview') || p.includes('brief') || p.includes('analysis');
    if (isSummarizeRequest) {
      if (docContext && docContext.trim()) {
        return generateDocumentSummary(docContext, docName);
      }
      if (mode.includes('Smith') || caseId) {
        return `### Case Summary: Smith v. TechCorp International (2021)\n\n**Court**: High Court of Delhi / Commercial Appellate Division\n**Subject Matter**: Intellectual Property Misappropriation, Trade Secrets, and Non-Compete Enforceability\n\n**Core Legal Issues**:\n1. Whether post-termination restrictive covenants are void under **Section 27 of the Indian Contract Act, 1872**.\n2. Injunction standards regarding source code and proprietary trade secret misappropriation.\n\n**Judicial Holdings**:\n- Restraints on employment post-termination are void under Section 27, even if reasonable in duration.\n- Protection of confidential proprietary code and trade secrets is upheld, granting an interim injunction against unauthorized dissemination.\n\n**Strategic Takeaway**: Non-compete covenants cannot bar an employee's livelihood, but non-disclosure covenants remain strictly enforceable.`;
      }
      return `### 📄 Document Summarization\n\nPlease upload a document using the 📎 paperclip icon below, or specify which legal judgment/statute you would like me to summarize!`;
    }

    // 5. If document is present and user asks question about it
    if (docContext && docContext.trim()) {
      const cleanDoc = docContext.trim();
      const queryWords = p.split(/\s+/).filter(w => w.length > 3);
      const lines = cleanDoc.split(/\r?\n/).filter(Boolean);
      const matchingLines = lines.filter(line => queryWords.some(qw => line.toLowerCase().includes(qw)));

      if (matchingLines.length > 0) {
        return `### Document Analysis: Query Match\n\n**Query**: "${prompt}"\n\n**Relevant Sections from Document**:\n${matchingLines.slice(0, 4).map(l => `> ${l}`).join('\n\n')}\n\n**Legal Interpretation**:\nBased on the excerpted text from **${docName || 'the uploaded document'}**, this provision directly governs the issue raised. Ensure compliance with the governing conditions and statutory limitation rules.`;
      }
    }

    // 6. Landmark Precedents & Constitutional Provisions
    if (p.includes('navtej') || p.includes('377') || p.includes('johar')) {
      return `### Navtej Singh Johar & Ors. v. Union of India (2018)\n\n**Overview**:\n*Navtej Singh Johar v. Union of India* (2018) 10 SCC 1 is a landmark 5-Judge Constitution Bench judgment of the Supreme Court of India that unanimously struck down Section 377 of the Indian Penal Code (IPC) in so far as it criminalized consensual sexual acts between adults in private.\n\n**Key Principles**:\n1. **Right to Dignity & Privacy (Article 21)**: Consensual intimate choices are protected under the fundamental rights to dignity, autonomy, and personal liberty.\n2. **Non-Discrimination (Article 15)**: Sex-based discrimination includes discrimination on the basis of sexual orientation.\n3. **Constitutional Morality**: CJI Dipak Misra emphasized that constitutional morality must always prevail over societal morality.`;
    }

    if (p.includes('kesavananda') || p.includes('basic structure')) {
      return `### Kesavananda Bharati v. State of Kerala (1973)\n\n**Overview**:\nThe historic 13-Judge Constitution Bench decision that established the **Basic Structure Doctrine** of the Indian Constitution.\n\n**Key Precedents**:\n1. **Limits on Amending Power**: Parliament possesses wide powers to amend the Constitution under Article 368, but cannot alter, destroy, or emasculate its basic structure.\n2. **Elements of Basic Structure**: Includes Supremacy of the Constitution, Judicial Review, Secularism, Federalism, and Separation of Powers.`;
    }

    if (p.includes('maneka') || p.includes('procedure established by law')) {
      return `### Maneka Gandhi v. Union of India (1978)\n\n**Overview**:\nA landmark 7-Judge Bench ruling that transformed Article 21 and Indian constitutional jurisprudence.\n\n**Key Principles**:\n1. **Fair & Reasonable Procedure**: The phrase "procedure established by law" in Article 21 cannot be arbitrary or oppressive; it must satisfy the test of fairness and natural justice.\n2. **Golden Triangle**: Established that Articles 14, 19, and 21 are interconnected and form a golden triangle of fundamental freedoms.`;
    }

    if (p.includes('article 21') || p.includes('privacy') || p.includes('puttaswamy')) {
      return `### Article 21 & Right to Privacy (Puttaswamy 2017)\n\n**Overview**:\nArticle 21 guarantees that *"No person shall be deprived of his life or personal liberty except according to procedure established by law."*\n\n**Judicial Scope**:\n- **Right to Privacy**: Recognized unanimously by a 9-Judge Constitution Bench in *Justice K.S. Puttaswamy v. UOI (2017)* as a fundamental right.\n- **Encompassed Rights**: Includes Right to Clean Environment, Right to Legal Aid, Right to Speedy Trial, Right to Autonomy, and Right to Live with Human Dignity.`;
    }

    if (p.includes('bail') || p.includes('438') || p.includes('anticipatory')) {
      return `### Anticipatory Bail & Bail Jurisprudence in India\n\n**Overview**:\nGoverned under **Section 438 of the Code of Criminal Procedure, 1973** (and corresponding provisions of the **Bharatiya Nagarik Suraksha Sanhita, 2023**).\n\n**Key Principles (Supreme Court)**:\n1. **Personal Liberty (Article 21)**: In *Gurbaksh Singh Sibbia (1980)* and *Sushila Aggarwal (2020)*, a 5-Judge Constitution Bench reaffirmed that anticipatory bail should not be arbitrarily limited in time unless special conditions require it.\n2. **Factors Considered**: Gravity of the offense, role attributable to the applicant, risk of flight, and likelihood of tampering with evidence.\n3. **Conditions**: Applicant must make themselves available for interrogation as directed by the investigating officer.`;
    }

    return `### LexIntel AI Legal Analysis\n\n**Query**: "${prompt}"\n\n**Analysis & Principles**:\n1. **Statutory Framework**: Grounded in Indian constitutional law and reported judicial precedents.\n2. **Procedural Requirements**: Must comply with statutory guidelines under CPC / CrPC / BNSS and principles of natural justice.\n3. **Judicial Precedent**: Higher courts emphasize that constitutional morality and fundamental rights take precedence.\n\n*Disclaimer: LexIntel AI provides legal research assistance and analysis, not binding legal advice.*`;
  };

  useEffect(() => {
    fetch('/api/ai/conversations')
      .then(res => res.text())
      .then(raw => {
        if (!raw) return;
        try {
          const data = JSON.parse(raw);
          setConversations(Array.isArray(data) ? data : []);
        } catch(e){}
      })
      .catch(() => console.error("Could not load conversations"));

    // Fetch live cases from Case Management
    fetch('http://localhost:3001/api/cases')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCasesList(data);
      })
      .catch(() => {
        fetch('/api/cases')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) setCasesList(data);
          })
          .catch(() => {});
      });
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, processing, errorMessage]);

  const handleSend = async (forcedQuery?: string, isRetry = false, customDocText?: string, customDocName?: string) => {
    const q = forcedQuery || query;
    if (!q || !q.trim() || processing) return;

    const targetDocText = customDocText !== undefined ? customDocText : uploadedDocText;
    const targetDocName = customDocName !== undefined ? customDocName : uploadedDocName;

    setQuery('');
    setErrorMessage(null);
    setProcessing(true);

    let updatedHistory = chatHistory;
    if (!isRetry) {
      const newUserMsg = { role: 'user', content: q };
      updatedHistory = [...chatHistory, newUserMsg];
      setChatHistory(updatedHistory);
    }

    try {
      let isSuccess = false;
      let aiReply = '';
      let keyPoints: any = undefined;
      let sources: any = undefined;
      let suggestedQuestions: any = undefined;
      let disclaimer: any = undefined;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: q, 
            conversation: updatedHistory.slice(0, -1),
            caseId: caseId || (mode.includes('Smith') ? 'case-101' : undefined),
            documentText: targetDocText || undefined,
            documentContext: targetDocText || undefined,
            context: {
              mode: mode,
              documentName: targetDocName || undefined,
              caseId: caseId || (mode.includes('Smith') ? 'case-101' : undefined),
              documentText: targetDocText || undefined,
              documentContext: targetDocText || undefined
            }
          })
        });

        const rawText = await res.text();
        let data: any = {};
        if (rawText) {
          try {
            data = JSON.parse(rawText);
          } catch (jsonErr) {
            console.error("Non-JSON API response received:", rawText);
          }
        }

        if (res.ok && data.success !== false && data.reply) {
          isSuccess = true;
          aiReply = data.reply || data.answer || "No response received.";
          keyPoints = data.keyPoints;
          sources = data.sources;
          suggestedQuestions = data.suggestedQuestions;
          disclaimer = data.disclaimer;
        }
      } catch (backendErr) {
        console.warn("Backend fetch failed, using local AI fallback:", backendErr);
      }

      if (!isSuccess) {
        aiReply = generateLocalAiReply(q, targetDocText || undefined, targetDocName || undefined);
        suggestedQuestions = targetDocText ? [
          "What are the critical risks or liabilities in this document?",
          "Extract all deadlines, dates, and governing law clauses.",
          "Draft a formal legal reply or counter-argument for this document."
        ] : [
          "What is the key principle or precedent established here?",
          "How has the Supreme Court interpreted this in recent judgments?",
          "Explain this in simple terms for a legal draft."
        ];
        sources = targetDocText ? [{ title: targetDocName || "Uploaded Document", citation: `Document Context (~${(targetDocText.length / 1024).toFixed(1)} KB)` }] : [];
        disclaimer = "LexIntel AI provides legal research assistance and analysis, not binding legal advice.";
      }

      setChatHistory(prev => [...prev, {
        role: 'assistant', 
        content: aiReply,
        keyPoints,
        sources,
        suggestedQuestions,
        disclaimer
      }]);
    } catch (e: any) {
      console.error("Chat error:", e);
      setErrorMessage("Failed to generate response. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Directly summarize document upon upload
  const handleDocumentUploadAndSummarize = async (fileName: string, text: string) => {
    const uploadNotice = `📄 **Document Uploaded**: \`${fileName}\` (${(text.length / 1024).toFixed(1)} KB)\n\n*Please provide an executive summary and legal analysis of this document.*`;
    const newUserMsg = { role: 'user', content: uploadNotice };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);
    setErrorMessage(null);
    setProcessing(true);

    try {
      let isSuccess = false;
      let aiReply = '';
      let keyPoints: any = undefined;
      let sources: any = undefined;
      let suggestedQuestions: any = undefined;
      let disclaimer: any = undefined;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Please provide a detailed executive summary and legal analysis for the uploaded document: ${fileName}`,
            conversation: chatHistory,
            documentText: text,
            documentContext: text,
            context: {
              mode: 'Uploaded Document',
              documentName: fileName,
              documentText: text,
              documentContext: text
            }
          })
        });

        const rawText = await res.text();
        let data: any = {};
        if (rawText) {
          try { data = JSON.parse(rawText); } catch (e) {}
        }

        if (res.ok && data.success !== false && data.reply) {
          isSuccess = true;
          aiReply = data.reply || data.answer;
          keyPoints = data.keyPoints;
          sources = data.sources;
          suggestedQuestions = data.suggestedQuestions;
          disclaimer = data.disclaimer;
        }
      } catch (backendErr) {
        console.warn("Backend fetch failed, using local AI summarizer:", backendErr);
      }

      if (!isSuccess) {
        aiReply = generateDocumentSummary(text, fileName);
        sources = [{ title: fileName, citation: `Uploaded Document (${(text.length / 1024).toFixed(1)} KB)` }];
        suggestedQuestions = [
          "What are the critical risks or liabilities in this document?",
          "Extract all deadlines, dates, and governing law clauses.",
          "Draft a formal legal reply to this document."
        ];
        disclaimer = "LexIntel AI provides legal research assistance and analysis, not binding legal advice.";
      }

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: aiReply,
        keyPoints,
        sources,
        suggestedQuestions,
        disclaimer
      }]);
    } catch (err: any) {
      console.error("Auto-summarize error:", err);
      setErrorMessage("Failed to summarize uploaded document. Please click Retry.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content, true);
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setErrorMessage(null);
    setUploadedDocName(null);
    setUploadedDocText(null);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    setUploadedDocName(fileName);
    setMode('Uploaded Document');
    setProcessing(true);

    try {
      const extractedText = await extractTextFromFile(file);
      const cleanText = cleanExtractedDocumentText(extractedText);
      const finalText = cleanText && cleanText.length > 20 ? cleanText : extractedText;
      setUploadedDocText(finalText);
      // Automatically summarize the document into the chat!
      await handleDocumentUploadAndSummarize(fileName, finalText);
    } catch (err: any) {
      console.error("File processing error:", err);
      setErrorMessage(`Failed to process ${fileName}: ${err.message || 'Error reading document'}`);
    } finally {
      setProcessing(false);
      e.target.value = '';
    }
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((chunk, idx) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-white">{chunk.slice(2, -2)}</strong>;
      }
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return <code key={idx} className="bg-white/10 px-1.5 py-0.5 rounded text-accent-blue font-mono text-xs">{chunk.slice(1, -1)}</code>;
      }
      return chunk;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', lang: match[1] || 'code', content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return (
      <div className="space-y-3">
        {parts.map((part, pIdx) => {
          if (part.type === 'code') {
            return (
              <div key={pIdx} className="my-3 rounded-xl bg-navy-950 border border-white/10 overflow-hidden text-xs font-mono">
                <div className="bg-white/5 px-4 py-1.5 flex justify-between items-center text-slate-400 border-b border-white/10">
                  <span>{part.lang}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(part.content)}
                    className="hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </button>
                </div>
                <pre className="p-4 text-emerald-300 overflow-x-auto whitespace-pre">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          }

          const lines = part.content.split('\n');
          return (
            <div key={pIdx} className="space-y-2">
              {lines.map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return <h3 key={lIdx} className="text-base font-bold text-white mt-3 mb-1">{parseInline(line.replace('### ', ''))}</h3>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={lIdx} className="text-lg font-bold text-accent-blue mt-4 mb-1">{parseInline(line.replace('## ', ''))}</h2>;
                }
                if (line.startsWith('# ')) {
                  return <h1 key={lIdx} className="text-xl font-extrabold text-white mt-4 mb-2">{parseInline(line.replace('# ', ''))}</h1>;
                }
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-2 text-slate-200">
                      <span className="text-accent-purple text-base">•</span>
                      <span>{parseInline(line.trim().substring(2))}</span>
                    </div>
                  );
                }
                if (/^\d+\.\s/.test(line.trim())) {
                  const matchNum = line.trim().match(/^(\d+)\.\s(.*)/);
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-2 text-slate-200">
                      <span className="text-accent-blue font-semibold text-xs mt-0.5">{matchNum?.[1]}.</span>
                      <span>{parseInline(matchNum?.[2] || '')}</span>
                    </div>
                  );
                }
                if (!line.trim()) return <div key={lIdx} className="h-2" />;
                return <p key={lIdx} className="text-slate-200 leading-relaxed text-sm">{parseInline(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const aiTools = [
    { label: "Active Cases", query: "How many active cases do I have?", icon: FolderOpen },
    { label: "Pending Cases", query: "How many pending cases do I have?", icon: Clock },
    { label: "Upcoming Hearings", query: "When is my next hearing?", icon: Calendar },
    { label: "Article 21 Rights", query: "What is Article 21 of the Indian Constitution?", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-navy-900 pt-24 pb-0 flex flex-col h-screen overflow-hidden">
      <div className="container mx-auto px-4 lg:px-6 flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BrainCircuit className="text-accent-purple w-8 h-8" />
              AI Legal Assistant
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Your intelligent assistant for legal research, case analysis, and document understanding.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-3 py-2 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>

            <div className="relative">
              <span className="text-xs text-slate-400 mr-2">Context:</span>
              <select 
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 text-white rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-accent-purple cursor-pointer"
              >
                <option className="bg-navy-900">General Legal Research</option>
                <option className="bg-navy-900">Selected Case (Smith v. TechCorp)</option>
                <option className="bg-navy-900">Uploaded Document</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden pb-6">
          
          {/* Left Sidebar - Chat History & Visualization */}
          <div className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
            <div className="glass-card h-44 p-2">
              <AI3DVisualization processing={processing} />
            </div>
            
            <div className="glass-card flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-accent-purple" /> Recent Chats
                </h3>
                {chatHistory.length > 0 && (
                  <button 
                    onClick={handleNewChat}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                    title="Clear current conversation"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
                {conversations.map(conv => (
                  <div key={conv.id} className="group p-3 rounded-lg hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors">
                    <div className="truncate">
                      <div className="text-sm text-slate-300 truncate">{conv.title}</div>
                      <div className="text-xs text-slate-500">{conv.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="glass-card flex-1 flex flex-col overflow-hidden relative">
            
            {/* Uploaded Doc Indicator */}
            {uploadedDocName && (
              <div className="bg-accent-blue/10 border-b border-accent-blue/20 px-6 py-2.5 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-accent-blue shrink-0" />
                  <span>Document active: <strong className="text-white">{uploadedDocName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSend("Please summarize this uploaded document in detail.")}
                    className="px-2.5 py-1 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded text-[11px] font-medium transition-colors"
                  >
                    Summarize Again
                  </button>
                  <button 
                    onClick={() => handleSend("What are the key risks and liability clauses in this document?")}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors"
                  >
                    Extract Risks
                  </button>
                  <button 
                    onClick={() => handleSend("Extract all primary clauses and obligations from this document.")}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors"
                  >
                    Key Clauses
                  </button>
                  <button 
                    onClick={() => { setUploadedDocName(null); setUploadedDocText(null); }}
                    className="p-1 hover:text-white text-slate-400 hover:bg-white/10 rounded transition-colors"
                    title="Remove document"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-accent-purple/20 rounded-2xl flex items-center justify-center mb-6 border border-accent-purple/30">
                    <BrainCircuit className="w-8 h-8 text-accent-purple" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">LexIntel AI Legal Assistant</h2>
                  <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                    Say <code className="bg-white/10 px-1.5 py-0.5 rounded text-accent-blue font-mono text-xs">hi</code> to start, ask legal questions, or upload any document to get an instant executive summary and risk assessment.
                  </p>
                  
                  {/* Quick Upload or Sample Button */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-accent-blue rounded-lg text-xs font-medium transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> Upload Document (.txt, .md, .pdf)
                    </button>
                    <button
                      onClick={() => {
                        const sampleName = "Commercial_Services_Agreement_2026.txt";
                        const sampleText = `COMMERCIAL SERVICES & NON-DISCLOSURE AGREEMENT\nThis Agreement is entered into on 1st October, 2026, BETWEEN:\nApex Software Solutions Pvt. Ltd., Bengaluru, Karnataka (hereinafter "Client")\nAND\nLexTech Consulting LLP, Mumbai, Maharashtra (hereinafter "Consultant").\n\n1. SCOPE OF SERVICES\nThe Consultant agrees to provide AI compliance auditing, code verification, and data protection advisory.\n\n2. CONFIDENTIALITY & PROPRIETARY INFORMATION\nThe Consultant covenants not to disclose any proprietary algorithms, client data, or business methods. Survives termination for 5 years.\n\n3. TERM AND TERMINATION\nEither party may terminate upon 30 days written notice. Immediate termination applies upon material breach of confidentiality or IP misuse.\n\n4. INDEMNITY & LIMITATION OF LIABILITY\nConsultant indemnifies Client against third-party claims arising from IP infringement. Aggregate liability is capped at the total contract fee paid.\n\n5. DISPUTE RESOLUTION & ARBITRATION\nGoverned by the laws of India. Disputes shall be referred to arbitration in Bengaluru under the Arbitration and Conciliation Act, 1996.`;
                        setUploadedDocName(sampleName);
                        setUploadedDocText(sampleText);
                        setMode('Uploaded Document');
                        handleDocumentUploadAndSummarize(sampleName, sampleText);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/40 text-purple-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Try Sample Contract
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    {aiTools.map((tool, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSend(tool.query)}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-accent-purple/50 transition-all text-left flex items-start gap-3 group"
                      >
                        <tool.icon className="w-5 h-5 text-accent-purple mt-0.5 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{tool.label}</div>
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-[140px]">"{tool.query}"</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-5 ${
                      msg.role === 'user' 
                        ? 'bg-accent-blue/20 border border-accent-blue/30 text-white' 
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      {msg.role !== 'user' && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                          <BrainCircuit className="w-5 h-5 text-accent-purple" />
                          <span className="text-sm font-semibold text-white">LexIntel AI</span>
                        </div>
                      )}
                      
                      {msg.role === 'user' ? (
                        <div className="text-white text-sm whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        renderMarkdown(msg.content)
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {msg.sources.map((src: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 border border-white/10 rounded-lg text-xs text-slate-300">
                              <FileText className="w-3.5 h-3.5 text-accent-blue" />
                              <span>{src.title}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <h4 className="text-xs font-semibold text-slate-400 mb-2">Suggested Follow-ups:</h4>
                          <div className="flex flex-wrap gap-2">
                            {msg.suggestedQuestions.map((sq: string, idx: number) => (
                              <button key={idx} onClick={() => handleSend(sq)} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-300 hover:bg-white/10 transition-colors">
                                "{sq}"
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.disclaimer && (
                        <div className="mt-6 flex items-start gap-2 text-[10px] text-slate-500 bg-black/20 p-2 rounded">
                          <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
                          <p>{msg.disclaimer}</p>
                        </div>
                      )}

                      {msg.role !== 'user' && (
                        <div className="flex items-center gap-2 mt-4 pt-2 justify-end border-t border-white/5">
                          <button 
                            onClick={() => handleCopy(msg.content, i)} 
                            className="text-slate-400 hover:text-white flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors" 
                            title="Copy response"
                          >
                            {copiedIndex === i ? (
                              <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {processing && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-accent-purple animate-spin" />
                    <span className="text-sm text-slate-400">LexIntel AI is thinking...</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start justify-between gap-3 text-red-300 text-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-200">AI Error</div>
                      <div className="text-xs text-red-300/80 mt-1">{errorMessage}</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleRetry} 
                    className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium text-red-200 transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-navy-900/50">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".txt,.md,.pdf,.doc,.docx" 
              />
              <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-2 focus-within:border-accent-purple/50 transition-colors">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload document to analyze"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a legal question, request a document summary, or code example (Enter to send, Shift+Enter for new line)..."
                  className="w-full bg-transparent text-white resize-none max-h-32 min-h-[44px] py-2.5 focus:outline-none custom-scrollbar text-sm"
                  rows={1}
                />
                {processing ? (
                  <button disabled className="p-2.5 bg-accent-purple/50 text-white rounded-lg transition-colors cursor-not-allowed">
                    <Square className="w-5 h-5 fill-current animate-pulse" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSend()}
                    disabled={!query.trim()}
                    className="p-2.5 bg-accent-purple hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="text-center mt-2 flex justify-between items-center px-1">
                <span className="text-[10px] text-slate-500">LexIntel AI provides research assistance. Always verify citations with primary sources.</span>
                <span className="text-[10px] text-slate-500">Press <kbd className="bg-white/10 px-1 rounded text-slate-400">Shift + Enter</kbd> for line break</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
