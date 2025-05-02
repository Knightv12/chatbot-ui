import { Textarea } from "../ui/textarea";
import { cx } from 'classix';
import { Button } from "../ui/button";
import { ArrowUpIcon, Upload } from "./icons"
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

interface ChatInputProps {
    question: string;
    setQuestion: React.Dispatch<React.SetStateAction<string>>;
    onSubmit: (text?: string) => void;
    isLoading: boolean;
}

const suggestedActions = [
    {
        title: 'How to solve trigonometry',
        label: 'e.g., sin²θ + cos²θ = 1',
        action: 'Can you help me prove the trigonometric identity sin²θ + cos²θ = 1?',
    },
    {
        title: 'How to solve quadratic equations',
        label: 'e.g., ax² + bx + c = 0',
        action: 'Can you teach me how to solve quadratic equations in the form ax² + bx + c = 0?',
    },
];

export const ChatInput = ({ question, setQuestion, onSubmit, isLoading }: ChatInputProps) => {
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setFiles(prev => [...prev, ...filesArray]);
            
            // Create file info text to add to the message
            const fileInfoText = filesArray.map(file => 
                `[File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} KB]`
            ).join('\n');
            
            if (fileInfoText) {
                setQuestion(prev => prev + (prev ? '\n\n' : '') + fileInfoText);
            }
            
            toast.success(`${filesArray.length} file(s) attached`);
        }
    };

    const handleFileUploadClick = () => {
        fileInputRef.current?.click();
    };

    const clearFiles = () => {
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return(
    <div className="relative w-full flex flex-col gap-4">
        {showSuggestions && (
            <div className="hidden md:grid sm:grid-cols-2 gap-2 w-full">
                {suggestedActions.map((suggestedAction, index) => (
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.05 * index }}
                    key={index}
                    className={index > 1 ? 'hidden sm:block' : 'block'}
                    >
                        <Button
                            variant="ghost"
                            onClick={ () => {
                                const text = suggestedAction.action;
                                onSubmit(text);
                                setShowSuggestions(false);
                            }}
                            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
                        >
                            <span className="font-medium">{suggestedAction.title}</span>
                            <span className="text-muted-foreground">
                            {suggestedAction.label}
                            </span>
                        </Button>
                    </motion.div>
                ))}
            </div>
        )}
        
        <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            tabIndex={-1}
            onChange={handleFileChange}
        />

        <div className="relative">
            <Textarea
                placeholder="Send a message..."
                className={cx(
                    'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl text-base bg-muted pr-20',
                )}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();

                        if (isLoading) {
                            toast.error('Please wait for the model to finish its response!');
                        } else {
                            setShowSuggestions(false);
                            onSubmit();
                            clearFiles();
                        }
                    }
                }}
                rows={3}
                autoFocus
            />

            <div className="absolute bottom-2 right-2 flex gap-2">
                <Button 
                    className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
                    onClick={handleFileUploadClick}
                    type="button"
                    title="Upload file"
                    variant="ghost"
                >
                    <Upload size={14} />
                </Button>
                
                <Button 
                    className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
                    onClick={() => {
                        onSubmit(question);
                        clearFiles();
                    }}
                    disabled={question.length === 0 || isLoading}
                    title="Send message"
                >
                    <ArrowUpIcon size={14} />
                </Button>
            </div>
        </div>
        
        {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
                {files.map((file, index) => (
                    <div key={index} className="text-xs bg-muted rounded px-2 py-1 flex items-center">
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <Button 
                            variant="ghost" 
                            className="h-4 w-4 p-0 ml-1" 
                            onClick={() => {
                                setFiles(files.filter((_, i) => i !== index));
                                // Remove file info from message text
                                const fileInfo = `[File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} KB]`;
                                setQuestion(prev => prev.replace(fileInfo, '').trim());
                            }}
                        >
                            &times;
                        </Button>
                    </div>
                ))}
            </div>
        )}
    </div>
    );
}