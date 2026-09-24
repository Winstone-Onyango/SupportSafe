'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/input';
import { ArrowUp, Scale, Triangle, Check, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RequireNotAdmin from '@/components/RequireNotAdmin';

const ChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

type ChatFormValues = z.infer<typeof ChatSchema>;

const promptSuggestions = [
  { text: 'Kenyan Law', icon: <Scale className="text-gray-700 dark:text-gray-300" size={16} /> },
  {
    text: 'Kenyan Penal Code Section 4 (Chapter 63)',
    icon: <Triangle className="text-gray-700 dark:text-gray-300" size={16} />,
  },
  { text: 'Human Rights', icon: <Check className="text-gray-700 dark:text-gray-300" size={16} /> },
  {
    text: 'Personal Safety',
    icon: <Fingerprint className="text-gray-700 dark:text-gray-300" size={16} />,
  },
];

function LawBotContent() {
  const [messages, setMessages] = React.useState<
    {
      text: string;
      isUser: boolean;
    }[]
  >([]);

  const typingText = useTypingText('What can I help you with?');
  const [isThinking, setIsThinking] = React.useState<boolean>(false);
  // Custom hook for typing effect
  function useTypingText(text: string, speed: number = 100) {
    const [displayedText, setDisplayedText] = React.useState('');

    React.useEffect(() => {
      let index = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        if (index === text.length) clearInterval(intervalId);
      }, speed);

      return () => clearInterval(intervalId);
    }, [text, speed]);

    return displayedText;
  }

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(ChatSchema),
    defaultValues: { message: '' },
  });

  const onSubmit = async (data: ChatFormValues) => {
    setMessages((prev) => [...prev, { text: data.message, isUser: true }]);
    form.reset();
    setIsThinking(true);

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ userInput: data.message }),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    setMessages((prev) => [...prev, { text: result.reply, isUser: false }]);
    setIsThinking(false);
  };

  const handlePromptClick = (prompt: string) => {
    form.setValue('message', prompt);
    form.handleSubmit(onSubmit)();
  };

  if (messages.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-4 py-8 text-center">
        <h1 className="mb-5 text-2xl font-extrabold tracking-wide text-gray-700 dark:text-gray-100 sm:text-3xl">
          {typingText}
        </h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center max-w-3xl w-full gap-2"
        >
          <div className="flex w-full items-center rounded-3xl border border-gray-300 bg-slate-100 p-1 dark:border-slate-600 dark:bg-slate-800">
            <Input
              {...form.register('message')}
              className="border-none bg-slate-100 p-4 text-base focus-visible:ring-0 focus-visible:ring-transparent focus-within:ring-0 ring-offset-transparent dark:bg-slate-800 dark:text-gray-100 sm:p-5 sm:text-lg"
              placeholder="Chat with Law Bot"
              autoComplete="off"
            />
            <Button
              className="shrink-0 cursor-pointer rounded-full bg-slate-300 text-black dark:bg-slate-600 dark:text-gray-100"
              disabled={isThinking || !form.formState.isValid}
              type="submit"
              aria-label="Send message"
            >
              <ArrowUp size={24} />
            </Button>
          </div>
        </form>
        {/* Suggestion chips wrap onto as many lines as the phone needs */}
        <div className="mt-5 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-3">
          {promptSuggestions.map((prompt, index) => (
            <button
              key={index}
              onClick={() =>
                handlePromptClick(
                  typeof prompt === 'string' ? prompt : prompt.text
                )
              }
              className="flex max-w-full items-center gap-2 rounded-full border border-gray-300 px-3 py-2 text-left text-xs transition-colors hover:bg-gray-100 active:bg-gray-200 dark:border-slate-600 dark:text-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700 sm:px-4 sm:text-sm"
            >
              {typeof prompt !== 'string' && (
                <span className="shrink-0">{prompt.icon}</span>
              )}
              {typeof prompt === 'string' ? prompt : prompt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center">
      {/* One column that fills the page: transcript scrolls, composer stays put */}
      <div className="flex h-full w-full max-w-3xl flex-col px-2 sm:px-4">
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pt-3">
          <div className="flex flex-col gap-2 pb-2">
            {messages.length > 0 &&
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${
                    message.isUser ? 'justify-end' : ''
                  }`}
                >
                  {!message.isUser && (
                    <div
                      aria-label="SupportSafe Bot Avatar"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-800 bg-gradient-to-br from-blue-700 to-indigo-700 text-sm font-bold text-white shadow-sm sm:h-11 sm:w-11 sm:text-lg"
                    >
                      S
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] break-words rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[75%] sm:text-base ${
                      message.isUser
                        ? 'bg-green-500 text-white self-end'
                        : 'bg-gray-200 text-black self-start dark:bg-slate-700 dark:text-gray-100'
                    }`}
                  >
                    {message.isUser ? (
                      message.text
                    ) : (
                      // Markdown from the bot: tables/code scroll instead of
                      // bursting out of the bubble on a narrow screen.
                      <div className="max-w-full break-words [&_a]:break-all [&_code]:break-all [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {message.isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm sm:h-10 sm:w-10">
                      <h1 className="text-sm font-semibold sm:text-base">G</h1>
                    </div>
                  )}
                </div>
              ))}

            {isThinking && (
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 sm:w-[250px]" />
                  <Skeleton className="h-4 w-28 sm:w-[200px]" />
                </div>
              </div>
            )}
          </div>
        </div>
        {messages.length > 0 && (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full items-center gap-2 py-2 sm:py-3"
          >
            <div className="flex w-full items-center rounded-3xl border border-gray-300 bg-slate-100 p-1 dark:border-slate-600 dark:bg-slate-800">
              <Input
                {...form.register('message')}
                className="rounded-3xl border-none bg-slate-100 p-4 text-base focus-visible:ring-0 focus-visible:ring-transparent focus-within:ring-0 ring-offset-transparent dark:bg-slate-800 dark:text-gray-100 sm:p-5 sm:text-lg"
                placeholder="Chat with Law Bot"
                autoComplete="off"
              />
              <Button
                className="shrink-0 cursor-pointer rounded-full bg-slate-300 text-black dark:bg-slate-600 dark:text-gray-100"
                disabled={isThinking || !form.formState.isValid}
                type="submit"
                aria-label="Send message"
              >
                <ArrowUp size={24} />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Page() {
  return (
    <RequireNotAdmin>
      <LawBotContent />
    </RequireNotAdmin>
  );
}

export default Page;
