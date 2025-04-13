import { ChatInput } from "@/components/custom/chatinput";
import { PreviewMessage, ThinkingMessage } from "../../components/custom/message";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { useState, useRef, useEffect } from "react";
import { message } from "../../interfaces/interfaces"
import { Overview } from "@/components/custom/overview";
import { Header } from "@/components/custom/header";
import { v4 as uuidv4 } from 'uuid';
import LeftSidebar from '@/components/custom/mainleftsidebar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { user, logout } = useAuth();
  const { sendMessage } = useChat();

  useEffect(() => {
    // Initialize WebSocket connection
    const initSocket = () => {
      try {
        // 使用正確的WebSocket連接路徑
        const wsUrl = 'ws://localhost:3001/ws';
        console.log(`嘗試連接WebSocket: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log("WebSocket連接成功建立");
          socketRef.current = ws;
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket連接錯誤:", error);
        };
        
        ws.onclose = () => {
          console.log("WebSocket連接關閉");
          socketRef.current = null;
          // 重連邏輯
          setTimeout(() => {
            console.log("嘗試重新連接...");
            initSocket();
          }, 3000);
        };
      } catch (error) {
        console.error("建立WebSocket連接時出錯:", error);
      }
    };
    
    initSocket();
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      cleanupMessageHandler();
    };
  }, []);

  const cleanupMessageHandler = () => {
    if (messageHandlerRef.current && socketRef.current) {
      socketRef.current.removeEventListener("message", messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
  };

  async function handleSubmit(text?: string) {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || isLoading) {
      console.log("WebSocket not connected or currently loading, cannot send message");
      return;
    }

    const messageText = text || question;
    if (!messageText.trim()) return; // Check if message is empty
    
    setIsLoading(true);
    cleanupMessageHandler();
    
    const traceId = uuidv4();
    setMessages(prev => [...prev, { content: messageText, role: "user" as const, id: traceId }]);
    
    // Clear input field immediately
    setQuestion("");
    
    try {
      // Use chat context to send message
      await sendMessage(messageText, "general");
      socketRef.current.send(messageText);

      const messageHandler = (event: MessageEvent) => {
        setIsLoading(false);
        if(event.data.includes("[END]")) {
          cleanupMessageHandler();
          return;
        }
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          const newContent = lastMessage?.role === "assistant" 
            ? lastMessage.content + event.data 
            : event.data;
          
          const newMessage: message = { 
            content: newContent, 
            role: "assistant" as const, 
            id: traceId 
          };
          
          return lastMessage?.role === "assistant"
            ? [...prev.slice(0, -1), newMessage]
            : [...prev, newMessage];
        });
      };

      messageHandlerRef.current = messageHandler;
      socketRef.current.addEventListener("message", messageHandler);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <LeftSidebar />
      <Header user={user} onLogout={logout} />
      <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4" ref={messagesContainerRef}>
        {messages.length == 0 && <Overview />}
        {messages.map((message, index) => (
          <PreviewMessage key={index} message={message} />
        ))}
        {isLoading && <ThinkingMessage />}
        <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]"/>
      </div>
      <div className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        <ChatInput  
          question={question}
          setQuestion={setQuestion}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}