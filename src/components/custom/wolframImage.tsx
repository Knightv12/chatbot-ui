import React, { useState, useEffect } from 'react';

// URL重試策略列表
const urlStrategies = [
  (url: string) => url, // 原始URL
  (url: string) => {
    // 嘗試v1/simple格式
    if (url.includes('v1/plot') || url.includes('v1/result')) {
      return url.replace(/v1\/(plot|result)/, 'v1/simple');
    }
    return url;
  },
  (url: string) => {
    // 添加或更改寬度參數
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=800`;
  },
  (url: string) => {
    // 為簡單API添加背景參數
    if (url.includes('v1/simple')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}background=white`;
    }
    return url;
  }
];

interface WolframImageProps {
  url: string;
  title?: string;
  index?: number;
  debug?: boolean;
}

/**
 * 專門用於顯示Wolfram Alpha圖像的組件
 */
export const WolframImage: React.FC<WolframImageProps> = ({ url, title, index, debug = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [strategyIndex, setStrategyIndex] = useState(0);
  const [finalUrl, setFinalUrl] = useState(url);

  // 檢查URL是否有效
  const isValidUrl = url && (url.startsWith('http://') || url.startsWith('https://'));

  // 在組件加載時記錄URL信息
  useEffect(() => {
    console.log(`WolframImage: 嘗試載入圖像 #${index} - ${url}`);
    
    // 應用URL策略
    const processedUrl = urlStrategies[strategyIndex](url);
    console.log(`WolframImage: 應用策略 ${strategyIndex}, 處理後URL - ${processedUrl}`);
    setFinalUrl(processedUrl);
  }, [url, index, strategyIndex]);
  
  // 重試加載圖像
  const retryLoading = () => {
    // 如果還有未嘗試的策略
    if (strategyIndex < urlStrategies.length - 1) {
      console.log(`WolframImage: 嘗試新策略 ${strategyIndex + 1}/${urlStrategies.length - 1}`);
      setLoading(true);
      setError(false);
      setStrategyIndex(prev => prev + 1);
    } else if (attemptCount < 3) {
      // 如果策略用完了但仍可以重試
      console.log(`WolframImage: 重試載入圖像 #${index} - 嘗試 ${attemptCount + 1}/3`);
      setLoading(true);
      setError(false);
      setAttemptCount(prev => prev + 1);
      
      // 添加隨機參數以避免緩存
      const cacheBuster = `&cb=${Date.now()}`;
      setFinalUrl(prev => prev.includes('&cb=') ? prev : prev + cacheBuster);
    }
  };

  return (
    <div className="wolfram-image flex flex-col gap-1 my-4">
      {title && (
        <div className="text-sm font-medium">{title || `圖 ${index !== undefined ? index + 1 : 1}`}</div>
      )}
      
      {debug && (
        <div className="bg-gray-100 dark:bg-zinc-800 p-2 rounded text-xs my-1 overflow-auto">
          <p>調試信息:</p>
          <p>原始URL: {url}</p>
          <p>最終URL: {finalUrl}</p>
          <p>策略索引: {strategyIndex}/{urlStrategies.length - 1}</p>
          <p>嘗試次數: {attemptCount}/3</p>
          <p>狀態: {loading ? '載入中' : (error ? '錯誤' : '成功')}</p>
        </div>
      )}
      
      {isValidUrl ? (
        <>
          {loading && (
            <div className="flex justify-center items-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <span className="animate-pulse">載入圖像中...</span>
            </div>
          )}
          
          <img 
            src={finalUrl} 
            alt={title || `Wolfram Alpha 圖形${index !== undefined ? ` ${index + 1}` : ''}`} 
            className={`rounded-lg max-w-full border border-gray-200 dark:border-gray-700 ${loading ? 'hidden' : 'block'}`}
            loading="lazy"
            onLoad={() => {
              console.log(`WolframImage: 圖像 #${index} 載入成功`);
              setLoading(false);
            }}
            onError={() => {
              console.error(`WolframImage: 圖像 #${index} 載入失敗 - ${finalUrl}`);
              setLoading(false);
              setError(true);
            }}
          />
          
          {error && (
            <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-lg">
              圖像載入失敗。
              {strategyIndex < urlStrategies.length - 1 || attemptCount < 3 ? (
                <button 
                  onClick={retryLoading}
                  className="ml-2 underline hover:no-underline"
                >
                  嘗試其他格式
                </button>
              ) : (
                <span>您可以嘗試直接訪問此鏈接：
                  <a 
                    href={finalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mt-2 text-blue-500 hover:underline break-all"
                  >
                    {finalUrl}
                  </a>
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="p-4 text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 rounded-lg">
          無效的圖像URL: {url}
        </div>
      )}
    </div>
  );
};

/**
 * 檢測字符串中的Wolfram Alpha URL並返回提取的URL
 */
export const extractWolframUrl = (content: string): string[] => {
  const urls: string[] = [];
  
  // 記錄原始內容用於調試
  console.log('提取URL前的原始內容:', content);
  
  // 嘗試從特殊標記中提取 [WOLFRAM_IMAGE]URL[/WOLFRAM_IMAGE]
  const specialFormatRegex = /\[WOLFRAM_IMAGE\](.*?)\[\/WOLFRAM_IMAGE\]/g;
  let match;
  while ((match = specialFormatRegex.exec(content)) !== null) {
    if (match[1]) {
      console.log('找到特殊標記URL:', match[1]);
      urls.push(match[1]);
    }
  }
  
  // 如果找到特殊標記格式，直接返回
  if (urls.length > 0) {
    console.log('從特殊標記找到URLs:', urls);
    return urls;
  }
  
  // 嘗試從Markdown格式中提取
  const mdMatches = content.match(/!\[.*?\]\((https:\/\/api\.wolframalpha\.com\/.*?)\)/g);
  if (mdMatches) {
    mdMatches.forEach(mdMatch => {
      const urlMatch = mdMatch.match(/\((https:\/\/api\.wolframalpha\.com\/.*?)\)/);
      if (urlMatch && urlMatch[1]) {
        console.log('找到Markdown格式URL:', urlMatch[1]);
        urls.push(urlMatch[1]);
      }
    });
  }
  
  // 嘗試從HTML格式中提取
  const htmlMatches = content.match(/<img[^>]*src=["'](https:\/\/api\.wolframalpha\.com\/.*?)["'][^>]*>/g);
  if (htmlMatches) {
    htmlMatches.forEach(htmlMatch => {
      const urlMatch = htmlMatch.match(/src=["'](https:\/\/api\.wolframalpha\.com\/.*?)["']/);
      if (urlMatch && urlMatch[1]) {
        console.log('找到HTML格式URL:', urlMatch[1]);
        urls.push(urlMatch[1]);
      }
    });
  }
  
  // 直接查找Wolfram Alpha URL
  const directUrlMatch = content.match(/https:\/\/api\.wolframalpha\.com\/v1\/[^\s"')<>]+/g);
  if (directUrlMatch) {
    directUrlMatch.forEach(url => {
      console.log('找到直接URL:', url);
      // 確保URL不含換行符或其他無效字符
      const cleanUrl = url.trim().replace(/[\n\r\t]/g, '');
      if (!urls.includes(cleanUrl)) {
        urls.push(cleanUrl);
      }
    });
  }
  
  console.log('最終提取的URLs:', urls);
  return urls;
}; 