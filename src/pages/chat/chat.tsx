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
import { Message } from "../../components/custom/message";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from 'lucide-react';

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { user, logout } = useAuth();
  const { sendMessage } = useChat();

  const handleNewChat = () => {
    setMessages([]);
    setQuestion("");
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const initSocket = () => {
      try {
        // 使用環境變數中的WebSocket連接路徑
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
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

        let parsed;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          parsed = null;
        }

        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          let newContent;
          if (parsed && (parsed.text || parsed.images)) {
            newContent = parsed; // 直接存物件
          } else {
            newContent = lastMessage?.role === "assistant"
              ? (typeof lastMessage.content === "string" ? lastMessage.content : "") + event.data
              : event.data;
          }

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
      <div className="flex justify-end gap-2 px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewChat}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearMessages}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Messages
        </Button>
      </div>
      <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4" ref={messagesContainerRef}>
        {messages.length == 0 && <Overview />}
        {messages.map((message, index) => (
          <Message key={index} message={message} />
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