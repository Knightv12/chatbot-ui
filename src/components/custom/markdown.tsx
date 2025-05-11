import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import React from "react";

const WolframLinkDetector = (text: string) => {
  // 檢查文本中是否有Wolfram Alpha URL
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // 清理文本
  const cleanText = text.trim();
  
  // 檢查是否是完整的URL
  if (
    cleanText.startsWith('http') && 
    cleanText.includes('api.wolframalpha.com') && 
    !cleanText.includes(' ') &&
    (
      cleanText.includes('simple?appid=') ||
      cleanText.includes('v1/simple?') ||
      cleanText.includes('v1/plot')
    )
  ) {
    console.log('檢測到Wolfram Alpha純URL (更新後):', cleanText);
    return true;
  }
  
  return false;
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  
  // 檢查文本中是否有URL並嘗試渲染
  React.useEffect(() => {
    if (children && children.includes('api.wolframalpha.com')) {
      console.log('Markdown組件檢測到Wolfram Alpha URL:');
      
      // 提取所有URL
      const urls = children.match(/https:\/\/api\.wolframalpha\.com\/[^\s"')]+/g);
      if (urls) {
        urls.forEach((url, index) => {
          console.log(`URL ${index + 1}: ${url}`);
        });
      }
    }
  }, [children]);
  
  const components = {
    p: ({ node, children, ...props }: any) => {
      // 檢查段落是否只包含Wolfram Alpha URL
      if (typeof children === 'string' && WolframLinkDetector(children)) {
        return (
          <div className="my-4">
            <img 
              src={children.trim()} 
              alt="Wolfram Alpha 圖形" 
              className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700" 
              loading="lazy"
            />
          </div>
        );
      }
      
      // 檢查子元素中是否有Wolfram Alpha URL
      const hasWolframLink = React.Children.toArray(children).some(
        child => typeof child === 'string' && WolframLinkDetector(child)
      );
      
      if (hasWolframLink) {
        return (
          <div className="text-base leading-6 mb-6">
            {React.Children.map(children, child => {
              if (typeof child === 'string' && WolframLinkDetector(child)) {
                return (
                  <div className="my-4">
                    <img 
                      src={child.trim()} 
                      alt="Wolfram Alpha 圖形" 
                      className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700" 
                      loading="lazy"
                    />
                  </div>
                );
              }
              return child;
            })}
          </div>
        );
      }
      
      return (
        <p className="text-base leading-6 mb-6" {...props}>
          {children}
        </p>
      );
    },
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <pre
          {...props}
          className={`${className} text-sm w-[80dvw] md:max-w-[500px] overflow-x-scroll bg-zinc-100 p-3 rounded-lg mt-2 mb-6 dark:bg-zinc-800`}
        >
          <code className={match[1]}>{children}</code>
        </pre>
      ) : (
        <code
          className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
          {...props}
        >
          {children}
        </code>
      );
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="list-decimal list-outside ml-4 text-base mb-6" {...props}>
          {children}
        </ol>
      );
    },
    li: ({ node, children, ...props }: any) => {
      return (
        <li className="py-1 text-base" {...props}>
          {children}
        </li>
      );
    },
    ul: ({ node, children, ...props }: any) => {
      return (
        <ul className="list-decimal list-outside ml-4 text-base mb-6" {...props}>
          {children}
        </ul>
      );
    },
    strong: ({ node, children, ...props }: any) => {
      return (
        <span className="font-semibold text-base" {...props}>
          {children}
        </span>
      );
    },
    a: ({ node, children, ...props }: any) => {
      return (
        <a
          className="text-blue-500 hover:underline text-base"
          target="_blank"
          rel="noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
    img: ({ node, src, alt, ...props }: any) => {
      console.log("渲染圖片:", src);
      return (
        <div className="my-4 flex flex-col items-center">
          <img 
            src={src} 
            alt={alt || "圖片"} 
            className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700" 
            loading="lazy"
            {...props}
          />
          {alt && alt !== "Wolfram Alpha 圖形" && (
            <span className="text-sm text-gray-500 mt-1">{alt}</span>
          )}
        </div>
      );
    },
    h1: ({ node, children, ...props }: any) => {
      return (
        <h1 className="text-2xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ node, children, ...props }: any) => {
      return (
        <h2 className="text-xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      return (
        <h3 className="text-lg font-semibold mt-6 mb-2" {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ node, children, ...props }: any) => {
      return (
        <h4 className="text-base font-semibold mt-6 mb-2" {...props}>
          {children}
        </h4>
      );
    },
    h5: ({ node, children, ...props }: any) => {
      return (
        <h5 className="text-sm font-semibold mt-6 mb-2" {...props}>
          {children}
        </h5>
      );
    },
    h6: ({ node, children, ...props }: any) => {
      return (
        <h6 className="text-xs font-semibold mt-6 mb-2" {...props}>
          {children}
        </h6>
      );
    },
  };

  return (
    <div className="text-base font-normal">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeRaw]} 
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
