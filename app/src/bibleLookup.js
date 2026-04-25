/**
 * Client-side Bible lookup — reads XML directly from /bible/{VERSION}.xml
 * No backend API needed. All versions preloaded for instant switching.
 */

const xmlCache = {};
let preloadStarted = false;

/**
 * Returns the list of available Bible versions
 */
export const AVAILABLE_VERSIONS = [
  'KJV', 'NIV', 'ESV', 'NKJV', 'NLT', 'NASB',
  'AMP', 'MSG', 'RSV', 'MKJV', 'SVV', 'SWAB'
];

const fetchBibleXML = async (version) => {
  if (xmlCache[version]) return xmlCache[version];

  const res = await fetch(`/bible/${version}.xml`);
  if (!res.ok) throw new Error(`Bible version ${version} not available`);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  xmlCache[version] = doc;
  return doc;
};

/**
 * Preload ALL versions in the background for instant switching.
 * Call once at app startup.
 */
export const preloadAllBibles = () => {
  if (preloadStarted) return;
  preloadStarted = true;
  AVAILABLE_VERSIONS.forEach(v => {
    fetchBibleXML(v).catch(() => console.warn(`Could not preload ${v}`));
  });
};

/**
 * Look up verses directly from the XML.
 * @param {string} reference - e.g. "John 3:16" or "Genesis 1:1-5"
 * @param {string} version - e.g. "KJV", "NIV"
 * @returns {Promise<Array>} - [{ verse: 16, text: "For God so loved..." }]
 */
export const localLookupVerses = async (reference, version = 'KJV') => {
  // Parse the reference string
  const match = reference.match(/(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
  if (!match) return [];

  const [, bookName, chapterStr, startStr, endStr] = match;
  const chapterNum = parseInt(chapterStr);
  const startVerse = parseInt(startStr);
  const endVerse = endStr ? parseInt(endStr) : startVerse;

  const doc = await fetchBibleXML(version);
  const pureBooks = getPureBooks(doc);
  if (pureBooks.length === 0) return [];


  // --- Helper: Universal Attribute Matcher ---
  const nodeHasAttributeValue = (node, targetValue) => {
    const targetLower = String(targetValue).trim().toLowerCase();
    for (let i = 0; i < node.attributes.length; i++) {
      if (node.attributes[i].value.toLowerCase() === targetLower) {
        return true;
      }
    }
    return false;
  };

  const extractNumberFromAttributes = (node) => {
    for (let i = 0; i < node.attributes.length; i++) {
      const val = parseInt(node.attributes[i].value);
      if (!isNaN(val)) return val;
    }
    return -1;
  };

  // --- 2. FIND BOOK (Hybrid Index/String Approach) ---
  const STANDARD_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
    "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
    "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
    "1 John", "2 John", "3 John", "Jude", "Revelation"
  ];

  let targetBookNode = null;
  
  // Attempt 1: Index Mapping (Solves cross-language issues like English "Genesis" -> Swahili "Mwanzo")
  const targetIndex = STANDARD_BOOKS.findIndex(b => b.toLowerCase() === bookName.trim().toLowerCase());
  
  if (targetIndex !== -1 && targetIndex < pureBooks.length) {
    targetBookNode = pureBooks[targetIndex];
  } 
  // Attempt 2: Direct String Match (Fallback if the user typed in a non-English native name)
  else {
    for (const bookNode of pureBooks) {
      if (nodeHasAttributeValue(bookNode, bookName)) {
        targetBookNode = bookNode;
        break;
      }
    }
  }

  if (!targetBookNode) return []; // Book not found in this translation

  // --- 3. FIND CHAPTER ---
  let targetChapterNode = null;
  for (let i = 0; i < targetBookNode.children.length; i++) {
    const chapterNode = targetBookNode.children[i];
    if (nodeHasAttributeValue(chapterNode, chapterNum)) {
      targetChapterNode = chapterNode;
      break;
    }
  }

  if (!targetChapterNode) return [];

  // --- 4. EXTRACT VERSES ---
  const results = [];
  for (let i = 0; i < targetChapterNode.children.length; i++) {
    const verseNode = targetChapterNode.children[i];
    const verseNumber = extractNumberFromAttributes(verseNode);

    if (verseNumber >= startVerse && verseNumber <= endVerse) {
      results.push({
        verse: verseNumber,
        text: verseNode.textContent.trim()
      });
    }
  }

  return results;
};

// --- Helper: The Deep Scan (Middle-Out Garbage Slicer) ---
const getPureBooks = (doc) => {
  const rootChildren = Array.from(doc.documentElement.children);
  if (rootChildren.length === 0) return [];

  let middleIndex = Math.floor(rootChildren.length / 2);

  const isStructurallyValidBook = (node) => {
    if (!node || node.children.length === 0) return false;
    const sampleChapter = node.children[0];
    if (!sampleChapter || sampleChapter.children.length === 0) return false;
    return true; 
  };

  if (!isStructurallyValidBook(rootChildren[middleIndex])) {
    let found = false;
    for (let i = 0; i < rootChildren.length; i++) {
      if (isStructurallyValidBook(rootChildren[i])) {
        middleIndex = i;
        found = true;
        break;
      }
    }
    if (!found) return []; 
  }

  let startIndex = middleIndex;
  let endIndex = middleIndex;

  while (startIndex > 0 && isStructurallyValidBook(rootChildren[startIndex - 1])) {
    startIndex--;
  }
  while (endIndex < rootChildren.length - 1 && isStructurallyValidBook(rootChildren[endIndex + 1])) {
    endIndex++;
  }

  return rootChildren.slice(startIndex, endIndex + 1);
};

/**
 * Returns the native names of all 66 books directly from the XML attributes
 * This ensures UI dropdowns perfectly match the selected language version.
 */
export const getNativeBookNames = async (version = 'KJV') => {
  try {
    const doc = await fetchBibleXML(version);
    const pureBooks = getPureBooks(doc);
    
    // Extract the longest string attribute from each book node as its name
    // (Since tags like <BIBLEBOOK bname="Genesis"> or <b n="Genesis"> have the name as the primary text attribute)
    return pureBooks.map(bookNode => {
      let bestName = "";
      for (let i = 0; i < bookNode.attributes.length; i++) {
        const val = bookNode.attributes[i].value;
        // Avoid extracting numeric ID attributes if string names are available
        if (isNaN(parseInt(val)) && val.length > bestName.length) {
          bestName = val;
        }
      }
      return bestName || `Book ${pureBooks.indexOf(bookNode) + 1}`;
    });
  } catch (err) {
    console.error("Failed to extract native book names:", err);
    return [];
  }
};
