import { ConfidenceLevel } from '../src/types';
import { DrugDatabaseEntry, KNOWN_DRUG_DATABASE } from './medicalKnowledge';

export interface MedicineMatchResult {
  rawInput: string;
  matchedKey?: string;
  genericName: string;
  brandName?: string;
  displayName: string;
  standardStrengths: string[];
  dosageForms: string[];
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0 to 100
  isExactMatch: boolean;
  isFuzzyCorrection: boolean;
  isAmbiguous: boolean;
  candidateAlternatives: string[];
  educationalInfo?: DrugDatabaseEntry;
  matchNotes?: string;
}

export class MedicineMatcher {
  /**
   * Levenshtein distance between two strings
   */
  static levenshteinDistance(a: string, b: string): number {
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    const m = s1.length;
    const n = s2.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
      }
    }
    return dp[m][n];
  }

  /**
   * Jaro-Winkler similarity (0 to 1)
   */
  static jaroWinklerSimilarity(s1: string, s2: string): number {
    const str1 = s1.toLowerCase().trim();
    const str2 = s2.toLowerCase().trim();
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, str2.length);
      for (let j = start; j < end; j++) {
        if (!str2Matches[j] && str1[i] === str2[j]) {
          str1Matches[i] = true;
          str2Matches[j] = true;
          matches++;
          break;
        }
      }
    }

    if (matches === 0) return 0.0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (str1Matches[i]) {
        while (!str2Matches[k]) k++;
        if (str1[i] !== str2[k]) transpositions++;
        k++;
      }
    }

    const jaro =
      (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;

    // Winkler prefix bonus (up to 4 characters)
    let prefix = 0;
    for (let i = 0; i < Math.min(4, Math.min(str1.length, str2.length)); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
  }

  /**
   * Strip common prescription prefixes like "Tab", "Cap", "Syp", "Inj", "Rx"
   */
  static cleanMedicineName(raw: string): string {
    return raw
      .replace(/^(tab\.?|tablet|cap\.?|capsule|syp\.?|syrup|inj\.?|injection|oint\.?|ointment|drop|drp|rx\.?)\s+/i, '')
      .replace(/\s+(tab\.?|tablet|cap\.?|capsule|syp\.?|syrup)$/i, '')
      .replace(/[0-9]+\s*(mg|mcg|g|ml|iu|%)\b/gi, '') // strip trailing strength numbers
      .trim();
  }

  /**
   * Match a candidate raw medicine string against verified clinical knowledge
   */
  static matchMedicine(
    rawText: string,
    extractedStrength?: string,
    extractedForm?: string
  ): MedicineMatchResult {
    const cleaned = this.cleanMedicineName(rawText);
    const cleanedLower = cleaned.toLowerCase();

    // 1. Check exact match against generic key or brand alias
    for (const [key, drug] of Object.entries(KNOWN_DRUG_DATABASE)) {
      if (cleanedLower === key || drug.brandAliases.includes(cleanedLower)) {
        let confidenceScore = 96;
        if (extractedStrength && drug.commonStrengths.some((s) => extractedStrength.toLowerCase().includes(s.split(' ')[0]))) {
          confidenceScore = 99;
        }

        const brandMatch = drug.brandAliases.find((b) => b === cleanedLower);
        const brandName = brandMatch
          ? brandMatch.charAt(0).toUpperCase() + brandMatch.slice(1)
          : drug.brandAliases[0] ? drug.brandAliases[0].charAt(0).toUpperCase() + drug.brandAliases[0].slice(1) : undefined;

        return {
          rawInput: rawText,
          matchedKey: key,
          genericName: drug.genericName,
          brandName,
          displayName: brandName ? `${brandName} (${drug.genericName})` : drug.genericName,
          standardStrengths: drug.commonStrengths,
          dosageForms: drug.dosageForms,
          confidence: 'high',
          confidenceScore,
          isExactMatch: true,
          isFuzzyCorrection: false,
          isAmbiguous: false,
          candidateAlternatives: [],
          educationalInfo: drug,
          matchNotes: 'Verified exact match in clinical medication database.',
        };
      }
    }

    // 2. Fuzzy match across all keys and brand aliases
    interface MatchCandidate {
      key: string;
      drug: DrugDatabaseEntry;
      matchedTerm: string;
      similarity: number;
      distance: number;
    }

    const candidates: MatchCandidate[] = [];

    for (const [key, drug] of Object.entries(KNOWN_DRUG_DATABASE)) {
      // Compare key
      const keySim = this.jaroWinklerSimilarity(cleanedLower, key);
      const keyDist = this.levenshteinDistance(cleanedLower, key);
      candidates.push({ key, drug, matchedTerm: key, similarity: keySim, distance: keyDist });

      // Compare brand aliases
      for (const alias of drug.brandAliases) {
        const sim = this.jaroWinklerSimilarity(cleanedLower, alias);
        const dist = this.levenshteinDistance(cleanedLower, alias);
        candidates.push({ key, drug, matchedTerm: alias, similarity: sim, distance: dist });
      }
    }

    // Sort by highest similarity
    candidates.sort((a, b) => b.similarity - a.similarity);
    const topCandidate = candidates[0];

    // High confidence fuzzy match (similarity > 0.88 or distance <= 2 for words >= 5 chars)
    if (
      topCandidate &&
      (topCandidate.similarity >= 0.88 || (topCandidate.distance <= 2 && cleaned.length >= 5))
    ) {
      // Check if second candidate is very close (ambiguity check)
      const secondCandidate = candidates.find((c) => c.key !== topCandidate.key);
      const isAmbiguous =
        secondCandidate &&
        secondCandidate.similarity > 0.80 &&
        Math.abs(topCandidate.similarity - secondCandidate.similarity) < 0.08;

      let confidenceLevel: ConfidenceLevel = isAmbiguous ? 'medium' : 'high';
      let confidenceScore = Math.round(topCandidate.similarity * 100);

      // Context boost: if strength matches
      if (
        extractedStrength &&
        topCandidate.drug.commonStrengths.some((s) =>
          extractedStrength.toLowerCase().includes(s.split(' ')[0])
        )
      ) {
        confidenceScore = Math.min(98, confidenceScore + 6);
      }

      const brandMatch = topCandidate.drug.brandAliases[0];
      const brandName = brandMatch
        ? brandMatch.charAt(0).toUpperCase() + brandMatch.slice(1)
        : undefined;

      const alternatives: string[] = [];
      if (isAmbiguous && secondCandidate) {
        alternatives.push(`${topCandidate.drug.genericName} (${topCandidate.matchedTerm})`);
        alternatives.push(`${secondCandidate.drug.genericName} (${secondCandidate.matchedTerm})`);
      }

      return {
        rawInput: rawText,
        matchedKey: topCandidate.key,
        genericName: topCandidate.drug.genericName,
        brandName,
        displayName: isAmbiguous
          ? `${cleaned} [Likely: ${topCandidate.drug.genericName}]`
          : brandName
          ? `${brandName} (${topCandidate.drug.genericName})`
          : topCandidate.drug.genericName,
        standardStrengths: topCandidate.drug.commonStrengths,
        dosageForms: topCandidate.drug.dosageForms,
        confidence: confidenceLevel,
        confidenceScore,
        isExactMatch: false,
        isFuzzyCorrection: true,
        isAmbiguous,
        candidateAlternatives: alternatives,
        educationalInfo: topCandidate.drug,
        matchNotes: isAmbiguous
          ? `Handwriting close to multiple medicines. Possible: ${alternatives.join(' or ')}.`
          : `Standardized from OCR reading "${cleaned}" (Match: ${topCandidate.matchedTerm}).`,
      };
    }

    // Medium/Low confidence match
    if (topCandidate && topCandidate.similarity >= 0.72) {
      const secondCandidate = candidates.find((c) => c.key !== topCandidate.key);
      const alternatives = [
        `${topCandidate.drug.genericName} (${topCandidate.matchedTerm})`,
      ];
      if (secondCandidate && secondCandidate.similarity >= 0.65) {
        alternatives.push(`${secondCandidate.drug.genericName} (${secondCandidate.matchedTerm})`);
      }

      return {
        rawInput: rawText,
        matchedKey: topCandidate.key,
        genericName: topCandidate.drug.genericName,
        displayName: `${cleaned} (Possible: ${topCandidate.drug.genericName})`,
        standardStrengths: topCandidate.drug.commonStrengths,
        dosageForms: topCandidate.drug.dosageForms,
        confidence: 'medium',
        confidenceScore: Math.round(topCandidate.similarity * 85),
        isExactMatch: false,
        isFuzzyCorrection: true,
        isAmbiguous: true,
        candidateAlternatives: alternatives,
        educationalInfo: topCandidate.drug,
        matchNotes: `Possible medicine candidates: ${alternatives.join(', ')}. Please verify with physical label.`,
      };
    }

    // Unrecognized or bespoke medicine
    return {
      rawInput: rawText,
      genericName: cleaned || 'Unspecified Medicine',
      displayName: cleaned || 'Unspecified Medicine',
      standardStrengths: extractedStrength ? [extractedStrength] : ['As labelled'],
      dosageForms: extractedForm ? [extractedForm] : ['Tablet'],
      confidence: cleaned.length > 3 ? 'medium' : 'low',
      confidenceScore: cleaned.length > 3 ? 65 : 40,
      isExactMatch: false,
      isFuzzyCorrection: false,
      isAmbiguous: false,
      candidateAlternatives: [],
      matchNotes:
        'Prescription item read directly from handwriting. Please confirm details in the verification step.',
    };
  }
}
