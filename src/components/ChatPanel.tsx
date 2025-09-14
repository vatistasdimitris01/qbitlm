import React, { useState, useEffect, useRef } from 'react';
import { Notebook, ChatMessage, Source } from '../types';
import {
  generateGeneralResponseStream,
  generateTextContextResponseStream,
  generateGroundedResponse,
  generateMediaResponse
} from '../services/geminiService';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { UploadIcon } from './icons/UploadIcon';
import { AtSymbolIcon } from './icons/AtSymbolIcon';
import { XIcon } from './icons/XIcon';
import { SourceIcon } from './SourcePanel'; // Re-using SourceIcon component

interface ChatPanelProps {
  notebook: Notebook | null;
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

const ChatPanel: React.FC<ChatPanelProps> = ({ notebook }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionedSource, setMentionedSource] = useState<Source | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notebook) {
      setMessages([]);
      setMentionedSource(null);
    }
  }, [notebook]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (mentionRef.current && !mentionRef.current.contains(event.target as Node)) {
              setIsMentioning(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !notebook || isLoading) return;

    const currentInput = userInput;
    const currentMentionedSource = mentionedSource;
    const userMessage: ChatMessage = { role: 'user', content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setUserInput('');
    setMentionedSource(null);

    const modelMessage: ChatMessage = { role: 'model', content: '' };
    setMessages(prev => [...prev, modelMessage]);

    try {
        if (currentMentionedSource) {
            const sourceType = currentMentionedSource.origin.type;
            if (sourceType === 'text' || sourceType === 'file') {
                 const stream = await generateTextContextResponseStream(messages, currentInput, currentMentionedSource);
                 for await (const chunk of stream) {
                    setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: msg.content + chunk.text } : msg));
                 }
            } else if (sourceType === 'website') {
                 const result = await generateGroundedResponse(messages, currentInput, currentMentionedSource.content);
                 setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: result.text, citations: result.citations } : msg));
            } else if (sourceType === 'image' || sourceType === 'video') {
                 const result = await generateMediaResponse(currentInput, currentMentionedSource);
                 setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: result.text } : msg));
            }
        } else {
            const stream = await generateGeneralResponseStream(messages, currentInput);
            for await (const chunk of stream) {
                setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: msg.content + chunk.text } : msg));
            }
        }
    } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: "Sorry, something went wrong. Please try again." } : msg));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectMention = (source: Source) => {
    setMentionedSource(source);
    setIsMentioning(false);
    textareaRef.current?.focus();
  };

  if (!notebook) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 bg-slate-50 p-4">
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full">
            <div className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 p-4">
                 <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800">
                    <p>
                        <span className="font-semibold">
                            This chat is using {notebook.sources.length} source{notebook.sources.length !== 1 ? 's' : ''}
                        </span> from this notebook.
                    </p>
                    <p className="mt-1 text-xs">Mention a source with <span className="font-mono bg-indigo-100 px-1 py-0.5 rounded">@</span> to focus the conversation, or ask a general question.</p>
                </div>
            </div>
            <div className="px-4">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      {notebook.sources.length > 0 ? (
                        <p>Ask a question about "{notebook.title}" to begin.</p>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <UploadIcon className="w-16 h-16 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">This notebook is empty.</p>
                          <p className="max-w-md mt-1 text-sm">Add a source to start a conversation.</p>
                        </div>
                      )}
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
      </div>
      <div className="px-4 pb-4 bg-gradient-to-t from-slate-50 to-transparent">
        <div className="w-full max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-center p-2 bg-white border border-gray-200 rounded-full shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-indigo-500">
            <div className="relative" ref={mentionRef}>
              <button
                  type="button"
                  onClick={() => setIsMentioning(prev => !prev)}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                  aria-label="Mention a source"
              >
                  <AtSymbolIcon className="w-5 h-5" />
              </button>
              {isMentioning && (
                <div className="absolute bottom-full mb-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-20">
                  <div className="p-2 text-xs font-semibold text-gray-500 border-b">Mention a source</div>
                  <ul className="max-h-60 overflow-y-auto">
                    {notebook.sources.length > 0 ? notebook.sources.map(source => (
                      <li key={source.id}>
                        <button 
                          type="button"
                          onClick={() => handleSelectMention(source)}
                          className="w-full flex items-center text-left p-2 hover:bg-indigo-50"
                        >
                          <SourceIcon type={source.origin.type} />
                          <span className="truncate text-sm text-gray-800">{source.title}</span>
                        </button>
                      </li>
                    )) : (
                      <li className="p-4 text-sm text-center text-gray-500">No sources in this notebook.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            {mentionedSource && (
              <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-800 text-sm font-medium pl-3 pr-2 py-1 rounded-full mx-2 whitespace-nowrap">
                <SourceIcon type={mentionedSource.origin.type} />
                <span className="truncate max-w-xs">{mentionedSource.title}</span>
                <button
                  type="button"
                  onClick={() => setMentionedSource(null)}
                  className="p-0.5 rounded-full hover:bg-indigo-200"
                  aria-label={`Remove mention of ${mentionedSource.title}`}
                >
                  <XIcon className="w-3 h-3"/>
                </button>
              </div>
            )}
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
                placeholder={mentionedSource ? `Ask about ${mentionedSource.title}...` : 'Ask a question...'}
                className="flex-1 w-full bg-transparent pl-2 pr-2 py-2 text-gray-900 resize-none focus:outline-none focus:ring-0 max-h-40 overflow-y-auto"
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
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
