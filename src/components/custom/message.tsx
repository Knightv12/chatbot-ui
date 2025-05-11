import { motion } from 'framer-motion';
import { cx } from 'classix';
import { SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { message } from "../../interfaces/interfaces"
import { MessageActions } from '@/components/custom/actions';
import { CopyIcon, CheckCirclFillIcon, BugIcon } from "./icons";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { WolframImage, extractWolframUrl } from './wolframImage';
import type { message as MessageType, WolframContent } from "../../interfaces/interfaces";

export const PreviewMessage = ({ message }: { message: message; }) => {
  return (
    <motion.div
      className="w-full flex justify-center mx-auto max-w-3xl px-4 group/message mb-8"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div className={cx(
        'group-data-[role=user]/message:bg-zinc-700 dark:group-data-[role=user]/message:bg-muted group-data-[role=user]/message:text-white flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl'
      )}>
        {message.role === 'assistant' && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div className="flex flex-col w-full">
          {typeof message.content === "string" && (
            <div className="flex flex-col gap-6 text-left text-base py-3">
              <Markdown>{message.content}</Markdown>
            </div>
          )}

          {message.role === 'assistant' && (
            <MessageActions message={message} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full flex justify-center mx-auto max-w-3xl px-4 group/message mb-8"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          'group-data-[role=user]/message:bg-muted'
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>
      </div>
    </motion.div>
  );
};

interface MessageProps {
  message: {
    role: "user" | "assistant";
    content: string;
    wolframData?: {
      text: string[];
      images: { title: string; url: string }[];
    };
  };
}

export const Message = ({ message }: { message: MessageType }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [extractedImageUrls, setExtractedImageUrls] = useState<string[]>([]);
  const [processedContent, setProcessedContent] = useState<string>('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (typeof message.content !== "string") return;

    // 提取 Wolfram Alpha 圖片 URL
    const wolframImgRegex = /(https:\/\/api\.wolframalpha\.com\/v1\/simple[^\s]*)/g;
    const matches = message.content.match(wolframImgRegex);
    if (matches) {
      setExtractedImageUrls(matches);
    }

    setProcessedContent(message.content);
  }, [message.content]);

  const handleCopy = () => {
    if (typeof message.content !== "string") return;
    const contentWithoutMarkdown = message.content.replace(/[*_~`#]/g, '');
    navigator.clipboard.writeText(contentWithoutMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  const handleImageError = (url: string) => {
    setImageLoadErrors(prev => ({...prev, [url]: true}));
  };

  if (
    typeof message.content === "object" &&
    (Array.isArray(message.content.text) || Array.isArray(message.content.images))
  ) {
    const wolframContent = message.content as WolframContent;
    return (
      <div className="w-full flex justify-center mx-auto max-w-3xl px-4 group/message mb-8">
        <div className="message text-left">
          {wolframContent.text && wolframContent.text.map((t, i) => <div key={i}>{t}</div>)}
          {wolframContent.images && wolframContent.images.map((img, i) => (
            <div key={i} className="mt-4">
              <div className="text-sm text-gray-500 mb-1">{img.title}</div>
              <img 
                src={img.url} 
                alt={img.title} 
                className="max-w-[400px] rounded-lg shadow-lg"
                onError={() => handleImageError(img.url)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (typeof message.content === "string") {
    return (
      <div className="w-full flex justify-center mx-auto max-w-3xl px-4 group/message mb-8">
        <div className="message relative text-left">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <Markdown>{processedContent}</Markdown>
            </div>
            <button
              onClick={toggleDebugInfo}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ml-2"
              title="切換調試模式"
            >
              <BugIcon size={16} />
            </button>
          </div>
          
          {showDebugInfo && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              <div>原始內容: {message.content}</div>
              <div>處理後內容: {processedContent}</div>
              <div>提取的圖片 URL: {extractedImageUrls.join(', ')}</div>
            </div>
          )}

          {extractedImageUrls.map((url, i) => (
            !imageLoadErrors[url] && (
              <div key={i} className="mt-4">
                <img 
                  src={url} 
                  alt="Wolfram Alpha 結果" 
                  className="max-w-[400px] rounded-lg shadow-lg"
                  onError={() => handleImageError(url)}
                />
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  return <div className="w-full flex justify-center mx-auto max-w-3xl px-4 group/message mb-8"><div className="message text-left">無法解析訊息內容</div></div>;
};
