import type { Issue, IssueLevel } from "@api/issues.types";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type TriageCitation = {
  issueId: string;
  name: string;
  message: string;
  similarity: number;
};

export type TriageResult = {
  summary: string;
  rootCause: string;
  suggestedFix: string;
  citations: TriageCitation[];
};

export type ParsedFilter = {
  level?: IssueLevel;
  projectLanguage?: "react" | "node" | "python";
  search?: string;
  minEvents?: number;
};

export type NLFilterResult = {
  filter: ParsedFilter;
  rationale: string;
};

export type IssueWithProject = Issue & {
  projectName?: string;
  projectLanguage?: string;
};
