// 正確導入 wolfram-alpha-api
const { WolframAlpha } = require('wolfram-alpha-api');

// 正確初始化 Wolfram Alpha API
const wolframAPI = new WolframAlpha('5PYGQG-WRJHRP392T');

/**
 * 優化 Wolfram Alpha 查詢，提取數學表達式
 * @param {string} query 原始查詢
 * @returns {string} 優化後的查詢
 */
const optimizeWolframQuery = (query) => {
  // 移除中文文字和非必要內容
  const mathRegex = /(sin|cos|tan|log|exp|sqrt|plot)[\s\(].*[\)\d\w\+\-\*\/\^\=]/i;
  const mathMatch = query.match(mathRegex);
  
  if (mathMatch) {
    return mathMatch[0];
  }
  
  // 檢查是否包含特定關鍵詞，如果是，提取 sin(x) 等函數
  const functionRegex = /(sin|cos|tan|log|exp|sqrt|plot)\s*\(\s*([a-zA-Z0-9]+)\s*\)/i;
  const functionMatch = query.match(functionRegex);
  
  if (functionMatch) {
    return functionMatch[0];
  }
  
  // 如果查詢包含 "plot" 和某個函數，構造繪圖命令
  if (query.toLowerCase().includes('plot') || query.toLowerCase().includes('繪') || 
      query.toLowerCase().includes('畫') || query.toLowerCase().includes('圖')) {
    
    const funcRegex = /(sin|cos|tan|log|exp|sqrt)\s*\(\s*([a-zA-Z0-9]+)\s*\)/i;
    const funcMatch = query.match(funcRegex);
    
    if (funcMatch) {
      return `plot ${funcMatch[0]}`;
    }
  }
  
  // 如果都不符合，預設保留原始查詢但移除中文字元
  return query.replace(/[\u4e00-\u9fa5]+/g, '').trim();
};

/**
 * 使用 Wolfram Alpha API 查詢數學問題並獲取結果
 * @param {string} query 數學查詢問題
 * @returns {Promise<Object>} 包含文本結果和可能的圖像URL
 */
const queryWolframAlpha = async (query) => {
  try {
    console.log('Original query:', query);
    
    // 優化查詢
    const optimizedQuery = optimizeWolframQuery(query);
    console.log('Optimized query for Wolfram Alpha:', optimizedQuery);
    
    // 獲取結果
    const result = await wolframAPI.query(optimizedQuery);
    console.log('Wolfram Alpha API response received');
    
    // 處理結果
    const pods = result.pods || [];
    const results = {
      text: [],
      images: []
    };

    // 從各個 pod 中提取數據
    for (const pod of pods) {
      if (pod.title && pod.subpods) {
        // 添加 pod 標題
        results.text.push(`**${pod.title}:**`);
        
        // 遍歷所有 subpod
        for (const subpod of pod.subpods) {
          // 添加文本內容
          if (subpod.plaintext) {
            results.text.push(subpod.plaintext);
          }
          
          // 添加圖像 URL
          if (subpod.img && subpod.img.src) {
            console.log('Found image URL:', subpod.img.src);
            results.images.push({
              title: pod.title,
              url: subpod.img.src
            });
          }
        }
      }
    }

    console.log(`Extracted ${results.text.length} text items and ${results.images.length} images`);
    return results;
  } catch (error) {
    console.error('Wolfram Alpha API Error:', error);
    throw new Error('無法處理 Wolfram Alpha 請求: ' + (error.message || '未知錯誤'));
  }
};

/**
 * 獲取簡短的計算結果
 * @param {string} query 數學查詢問題
 * @returns {Promise<string>} 簡短的計算結果
 */
const getShortAnswer = async (query) => {
  try {
    // 優化查詢
    const optimizedQuery = optimizeWolframQuery(query);
    console.log('Optimized query for short answer:', optimizedQuery);
    
    const result = await wolframAPI.query(optimizedQuery);
    return result.pods[0].subpods[0].plaintext;
  } catch (error) {
    console.error('Wolfram Alpha Short API Error:', error);
    throw new Error('無法獲取簡短答案: ' + (error.message || '未知錯誤'));
  }
};

/**
 * 檢測是否為數學問題
 * @param {string} text 要檢測的文本
 * @returns {boolean} 是否為數學問題
 */
const isMathQuery = (text) => {
  // 轉換為小寫以進行不區分大小寫的比較
  const lowerText = text.toLowerCase();
  
  // 數學相關關鍵詞
  const mathKeywords = [
    'plot', 'graph', 'equation', 'function', 'curve', '繪製', '繪圖', '畫圖', 
    'draw', 'sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', '開方', '平方',
    'polynomial', '多項式', 'derivative', '導數', '微分', 'integrate', '積分',
    'solve', '解', 'simplify', '化簡', 'factor', '因式分解', 'expand', '展開'
  ];
  
  // 常見圖形繪製命令
  const plotCommands = [
    'plot', 'graph', 'draw', 'show', '繪製', '繪圖', '畫圖', '顯示',
    'plot graph', 'plot function', 'draw graph', 'draw function',
    '繪製圖形', '繪製函數', '畫出圖形', '顯示圖形'
  ];
  
  // 簡單的數學運算符號檢測
  const mathOperators = /[\+\-\*\/\^\=\<\>\(\)\[\]\{\}]/;
  const mathFunctions = /\b(sin|cos|tan|log|ln|exp|sqrt|derivative|integral|limit|solve|simplify|factor|expand)\b/i;
  const mathSymbols = /\b(pi|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|infinity)\b/i;
  
  // 檢查數學關鍵詞
  for (const keyword of mathKeywords) {
    if (lowerText.includes(keyword)) {
      console.log(`Math keyword detected: ${keyword}`);
      return true;
    }
  }
  
  // 檢查繪圖命令
  for (const command of plotCommands) {
    if (lowerText.includes(command)) {
      console.log(`Plot command detected: ${command}`);
      return true;
    }
  }
  
  // 檢查數學符號
  if (mathOperators.test(text)) {
    console.log('Math operators detected');
    return true;
  }
  
  if (mathFunctions.test(text)) {
    console.log('Math functions detected');
    return true;
  }
  
  if (mathSymbols.test(text)) {
    console.log('Math symbols detected');
    return true;
  }
  
  // 檢查等號和數學式
  const equationPattern = /y\s*=\s*.+|f\s*\(.+\)\s*=\s*.+/i;
  if (equationPattern.test(text)) {
    console.log('Equation pattern detected');
    return true;
  }
  
  console.log('No math pattern detected');
  return false;
};

function convertWolframUrlToMarkdownImg(text) {
  const pattern = /(https:\/\/api\.wolframalpha\.com\/v1\/simple[^\s]*)/g;
  return text.replace(pattern, '![Wolfram Alpha 圖形]($1)');
}

function generateWolframMarkdownImage(url) {
  return `![Wolfram Alpha 圖形](${url})`;
}

module.exports = {
  queryWolframAlpha,
  getShortAnswer,
  isMathQuery,
  optimizeWolframQuery,
  generateWolframMarkdownImage
}; 