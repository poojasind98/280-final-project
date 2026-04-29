import type { Issue } from "@api/issues.types";

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "to",
  "in",
  "is",
  "it",
  "and",
  "or",
  "for",
  "on",
  "at",
  "by",
  "be",
  "as",
  "this",
  "that",
  "with",
  "from",
  "was",
  "are",
  "but",
  "not",
  "no",
  "if",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function issueText(issue: Issue): string {
  const firstStackLine = issue.stack ? issue.stack.split("\n")[1] || "" : "";
  return `${issue.name} ${issue.message} ${firstStackLine}`;
}

type Vector = Record<string, number>;

function tfidfVec(tokens: string[], idf: (t: string) => number): Vector {
  const tf: Record<string, number> = {};
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    tf[t] = (tf[t] || 0) + 1;
  }
  const vec: Vector = {};
  const total = tokens.length || 1;
  Object.keys(tf).forEach((t) => {
    vec[t] = (tf[t] / total) * idf(t);
  });
  return vec;
}

function cosine(a: Vector, b: Vector): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  Object.keys(a).forEach((k) => {
    const va = a[k];
    na += va * va;
    const vb = b[k];
    if (vb) dot += va * vb;
  });
  Object.keys(b).forEach((k) => {
    const vb = b[k];
    nb += vb * vb;
  });
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Tiny TF-IDF cosine similarity over the corpus of issues. No external deps,
 * no embedding model required. Surprisingly effective for short error strings
 * because shared identifier tokens (`TypeError`, `checkoutHandler`, `null`)
 * carry most of the signal.
 */
export function rankSimilarIssues(
  target: Issue,
  corpus: Issue[],
  topK = 4,
): Array<{ issue: Issue; similarity: number }> {
  const docs: string[][] = [];
  for (let i = 0; i < corpus.length; i++) {
    docs.push(tokenize(issueText(corpus[i])));
  }
  const targetTokens = tokenize(issueText(target));
  if (targetTokens.length === 0) return [];

  const docFreq: Record<string, number> = {};
  docs.forEach((doc) => {
    const seen: Record<string, true> = {};
    doc.forEach((tok) => {
      if (!seen[tok]) {
        seen[tok] = true;
        docFreq[tok] = (docFreq[tok] || 0) + 1;
      }
    });
  });

  const N = docs.length || 1;
  const idf = (t: string) => Math.log(1 + N / (1 + (docFreq[t] || 0)));

  const targetVec = tfidfVec(targetTokens, idf);

  const results: Array<{ issue: Issue; similarity: number }> = [];
  for (let i = 0; i < corpus.length; i++) {
    const issue = corpus[i];
    if (issue.id === target.id) continue;
    const sim = cosine(targetVec, tfidfVec(docs[i], idf));
    if (sim > 0) results.push({ issue, similarity: sim });
  }
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topK);
}
