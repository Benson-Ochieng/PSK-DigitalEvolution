export function formatPrice(amount: number | string | undefined | null, symbol = "KSh"): string {
  if (amount == null) return `${symbol} 0`;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol} 0`;
  return `${symbol} ${num.toLocaleString("en-KE")}`;
}

function stem(word: string): string {
  word = word.toLowerCase().trim();
  if (word.length <= 2) return word;
  
  const customMap: Record<string, string> = {
    tvs: "tv",
    tv: "tv",
    televisions: "television",
    television: "television",
    categories: "category",
    warranties: "warranty",
    accessories: "accessory"
  };
  
  if (customMap[word]) return customMap[word];

  if (word.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  }
  if (word.endsWith("es") && !word.endsWith("aes") && !word.endsWith("ees") && !word.endsWith("oes")) {
    if (word.endsWith("shes") || word.endsWith("ches") || word.endsWith("xes") || word.endsWith("ses")) {
      return word.slice(0, -2);
    }
  }
  if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us") && !word.endsWith("is") && !word.endsWith("as") && !word.endsWith("os")) {
    return word.slice(0, -1);
  }
  return word;
}

function editDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function isCloseMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  const len1 = word1.length;
  const len2 = word2.length;
  const minLen = Math.min(len1, len2);
  
  if (minLen <= 3) {
    return word1 === word2;
  }
  
  const maxDist = minLen <= 5 ? 1 : 2;
  return editDistance(word1, word2) <= maxDist || word1.includes(word2) || word2.includes(word1);
}

export function isSearchMatch(targetText: string, query: string): boolean {
  if (!targetText || !query) return false;
  
  const targetLower = targetText.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  
  if (targetLower.includes(queryLower)) return true;
  
  const queryWords = queryLower.split(/[^a-z0-9]+/i).filter(Boolean);
  const targetWords = targetLower.split(/[^a-z0-9]+/i).filter(Boolean);
  
  if (queryWords.length === 0) return false;
  
  const stemmedQueryWords = queryWords.map(stem);
  const stemmedTargetWords = targetWords.map(stem);
  
  return stemmedQueryWords.every(qWord => {
    return stemmedTargetWords.some(tWord => isCloseMatch(tWord, qWord));
  });
}
