import { getDb, Faq } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { faqs } from '@/lib/db/schema';
import { parseJsonSafely } from '@/lib/utils';
import logger from '@/lib/logger';

export interface FaqSearchResult {
  faq: Faq;
  score: number;
}

// TF-IDF implementation for fallback search
function calculateTfIdf(query: string, document: string, allDocuments: string[]): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const docTerms = document.toLowerCase().split(/\s+/);
  
  let score = 0;
  
  for (const term of queryTerms) {
    // Term frequency in document
    const tf = docTerms.filter(t => t.includes(term) || term.includes(t)).length / docTerms.length;
    
    // Inverse document frequency
    const docsContainingTerm = allDocuments.filter(doc => 
      doc.toLowerCase().includes(term)
    ).length;
    const idf = Math.log(allDocuments.length / (docsContainingTerm + 1));
    
    score += tf * idf;
  }
  
  return score;
}

// Simple keyword matching fallback
function simpleKeywordMatch(query: string, faq: Faq): number {
  const queryLower = query.toLowerCase();
  const questionLower = (faq.question || '').toLowerCase();
  const answerLower = (faq.answer || '').toLowerCase();
  const keywords = parseJsonSafely<string[]>(faq.keywords, []);
  
  let score = 0;
  
  // Exact question match
  if (questionLower === queryLower) {
    score += 100;
  }
  
  // Question contains query
  if (questionLower.includes(queryLower)) {
    score += 50;
  }
  
  // Query contains question
  if (queryLower.includes(questionLower)) {
    score += 30;
  }
  
  // Keyword matches
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    if (queryLower.includes(keywordLower) || keywordLower.includes(queryLower)) {
      score += 20;
    }
  }
  
  // Answer contains query terms
  const queryTerms = queryLower.split(/\s+/);
  for (const term of queryTerms) {
    if (term.length > 2) { // Skip very short words
      if (answerLower.includes(term)) {
        score += 5;
      }
    }
  }
  
  return score;
}

const SCORE_THRESHOLD = 10; // Minimum score to consider a match

export async function searchFaq(query: string): Promise<FaqSearchResult | null> {
  try {
    const db = await getDb();
    
    // Fetch all FAQs
    const allFaqs = await db.select().from(faqs);
    
    if (allFaqs.length === 0) {
      logger.warn('No FAQs found in database');
      return null;
    }
    
    // Try MongoDB Atlas Search first (if available)
    // Note: This requires setting up Atlas Search index
    try {
      // Placeholder for Atlas Search - would need to be implemented with $search aggregation
      // For now, we'll use fallback methods
    } catch (atlasError) {
      logger.debug('Atlas Search not available, using fallback');
    }
    
    // Fallback: TF-IDF + keyword matching
    const results: FaqSearchResult[] = [];
    
    const allDocuments = allFaqs.map(faq => 
      `${faq.question} ${faq.answer} ${parseJsonSafely<string[]>(faq.keywords, []).join(' ')}`
    );
    
    for (const faq of allFaqs) {
      const document = `${faq.question} ${faq.answer} ${parseJsonSafely<string[]>(faq.keywords, []).join(' ')}`;
      
      // Calculate scores using multiple methods
      const tfidfScore = calculateTfIdf(query, document, allDocuments);
      const keywordScore = simpleKeywordMatch(query, faq);
      
      // Combined score (weighted)
      const combinedScore = (tfidfScore * 10) + keywordScore;
      
      if (combinedScore > 0) {
        results.push({ faq, score: combinedScore });
      }
    }
    
    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    // Return top match if above threshold
    if (results.length > 0 && results[0].score >= SCORE_THRESHOLD) {
      logger.info('FAQ match found', { 
        query, 
        faqId: results[0].faq._id, 
        score: results[0].score 
      });
      return results[0];
    }
    
    logger.info('No FAQ match above threshold', { query, topScore: results[0]?.score || 0 });
    return null;
    
  } catch (error) {
    logger.error('Error searching FAQ', { error, query });
    return null;
  }
}

// Test function for FAQ search
export async function testFaqSearch(query: string): Promise<FaqSearchResult[]> {
  try {
    const db = await getDb();
    const allFaqs = await db.select().from(faqs);
    
    const allDocuments = allFaqs.map(faq => 
      `${faq.question} ${faq.answer} ${parseJsonSafely<string[]>(faq.keywords, []).join(' ')}`
    );
    
    const results: FaqSearchResult[] = [];
    
    for (const faq of allFaqs) {
      const document = `${faq.question} ${faq.answer} ${parseJsonSafely<string[]>(faq.keywords, []).join(' ')}`;
      const tfidfScore = calculateTfIdf(query, document, allDocuments);
      const keywordScore = simpleKeywordMatch(query, faq);
      const combinedScore = (tfidfScore * 10) + keywordScore;
      
      results.push({ faq, score: combinedScore });
    }
    
    return results.sort((a, b) => b.score - a.score);
  } catch (error) {
    logger.error('Error in test FAQ search', { error });
    return [];
  }
}

