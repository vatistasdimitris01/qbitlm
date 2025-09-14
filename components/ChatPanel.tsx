import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { Source, ChatMessage } from '../types';
import { createChatSession, generateGroundedResponse, generateMediaResponse } from '../services/geminiService';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ChatPanelProps {
  source: Source | null;
}

const Citations: React.FC<{ citations: ChatMessage['citations'] }> = ({ citations }) => {
    if (!citations || citations.length === 0) return null;

    return (
        <div className="mt-4 border-t pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sources</h4>
            <div className="mt-2 flex flex-col gap-2">
                {citations.map((citation, index) => (
                    <a 
                        href={citation.web.uri} 
                        key={index} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <p className="text-sm font-medium text-indigo-600 truncate group-hover:underline">{citation.web.title}</p>
                        <p className="text-xs text-gray-400 truncate">{citation.web.uri}</p>
                    </a>
                ))}
            </div>
        </div>
    );
};

const ChatMessageView: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isModel = message.role === 'model';
  return (
    <div className={`flex items-start gap-4 py-6 px-4`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white">
          {isModel ? <SparklesIcon className="w-5 h-5 text-indigo-500" /> : <UserIcon className="w-5 h-5 text-gray-500" />}
        </div>
        <div className="flex-1 pt-0.5">
          <div className="leading-relaxed whitespace-pre-wrap text-gray-800">{message.content || <span className="animate-pulse">...</span>}</div>
          {isModel && <Citations citations={message.citations} />}
        </div>
    </div>
  );
};

const SourcePreview: React.FC<{ source: Source }> = ({ source }) => {
    const { type } = source.origin;
    const commonTitle = <span className="font-semibold text-gray-800 truncate">{source.title}</span>;

    if (type === 'image') {
        return (
            <div className="flex items-center gap-3 min-w-0">
                <img src={source.content} alt={source.title} className="h-10 w-10 object-cover rounded-md border border-gray-200" />
                {commonTitle}
            </div>
        );
    }
    if (type === 'video') {
        return (
             <div className="flex items-center gap-3 min-w-0">
                <video src={source.content} className="h-10 w-10 object-cover rounded-md border border-gray-200 bg-black" />
                 {commonTitle}
            </div>
        );
    }
    return <span className="font-semibold text-indigo-600 truncate">{source.title}</span>;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ source }) => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isMediaAndNotPersisted = (source: Source | null): boolean => {
    if (!source) return false;
    const isMedia = source.origin.type === 'image' || source.origin.type === 'video';
    return isMedia && !source.content;
  };

  useEffect(() => {
    if (source && !isMediaAndNotPersisted(source)) {
      if (source.origin.type === 'text' || source.origin.type === 'file') {
        const session = createChatSession(source.content);
        setChatSession(session);
      } else {
        setChatSession(null);
      }
      setMessages([]);
    } else {
        setMessages([]);
        setChatSession(null);
    }
  }, [source]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !source || isLoading || isMediaAndNotPersisted(source)) return;

    const userMessage: ChatMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const currentInput = userInput;
    setUserInput('');

    const sourceType = source.origin.type;

    if (sourceType === 'website') {
      const modelMessage: ChatMessage = { role: 'model', content: '' };
      setMessages(prev => [...prev, modelMessage]);
      const { text, citations } = await generateGroundedResponse(messages, currentInput, source.content);
      setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: text, citations } : msg));
      setIsLoading(false);

    } else if (sourceType === 'image' || sourceType === 'video') {
      const modelMessage: ChatMessage = { role: 'model', content: '' };
      setMessages(prev => [...prev, modelMessage]);
      const { text, citations } = await generateMediaResponse(currentInput, source);
      setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: text, citations } : msg));
      setIsLoading(false);
      
    } else if (chatSession) {
      const modelMessage: ChatMessage = { role: 'model', content: '' };
      setMessages(prev => [...prev, modelMessage]);
      try {
          const stream = await chatSession.sendMessageStream({ message: currentInput });
          for await (const chunk of stream) {
              const chunkText = chunk.text;
              setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if(lastMessage) {
                    lastMessage.content += chunkText;
                  }
                  return newMessages;
              });
          }
      } catch (error) {
          console.error("Error sending message:", error);
          setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: "Sorry, something went wrong. Please try again." } : msg));
      } finally {
          setIsLoading(false);
      }
    }
  };

  if (!source) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 bg-slate-50 p-4">
        <SparklesIcon className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-lg font-medium">Select a source to start chatting.</p>
        <p className="max-w-md mt-1 text-sm">Your conversation will be based on the content of the selected document.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto w-full">
            {messages.length === 0 && !isMediaAndNotPersisted(source) && (
                <div className="text-center py-10 text-gray-500">
                    <p>Ask a question about "{source.title}" to begin.</p>
                </div>
            )}
            {isMediaAndNotPersisted(source) && (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">
                    <p className="font-semibold text-gray-700">Media content not available</p>
                    <p className="mt-1">Image and video content is not saved between sessions.</p>
                    <p>Please re-add this source to chat with it.</p>
                </div>
            )}
            <div className="divide-y divide-gray-200">
              {messages.map((msg, index) => (
                  <ChatMessageView key={index} message={msg} />
              ))}
            </div>
            <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="px-4 pb-4 bg-gradient-to-t from-slate-50 to-transparent">
        <div className="w-full">
          {isMediaAndNotPersisted(source) ? (
            <div className="relative flex items-center p-2 bg-white border border-gray-200 rounded-full shadow-lg">
              <p className="w-full text-center text-sm text-gray-500 py-2">Please re-add this media file to enable chat.</p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="relative flex items-center p-2 bg-white border border-gray-200 rounded-full shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-indigo-500">
            <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                    }
                }}
                placeholder={`Ask a question about ${source.title}...`}
                className="flex-1 w-full bg-transparent pl-4 pr-2 py-2 text-gray-900 resize-none focus:outline-none focus:ring-0 max-h-40 overflow-y-auto"
                rows={1}
                disabled={isLoading}
            />
            <button
                type="submit"
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                disabled={isLoading || !userInput.trim()}
                aria-label="Send message"
            >
                <ArrowUpIcon className="w-5 h-5 text-white" />
            </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;