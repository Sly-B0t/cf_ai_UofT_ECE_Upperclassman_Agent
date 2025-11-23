/** biome-ignore-all lint/correctness/useUniqueElementIds: it's alright */
import { useEffect, useState, useRef, useCallback, use } from "react";
import { useAgent } from "agents/react";
import { isToolUIPart } from "ai";
import { useAgentChat } from "agents/ai-react";
import type { UIMessage } from "@ai-sdk/react";
import type { tools } from "./tools";

// Component imports
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { Toggle } from "@/components/toggle/Toggle";
import { Textarea } from "@/components/textarea/Textarea";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ToolInvocationCard } from "@/components/tool-invocation-card/ToolInvocationCard";

// Icon imports
import {
  Bug,
  Moon,
  Robot,
  Sun,
  Trash,
  PaperPlaneTilt,
  Stop,
  Sparkle
} from "@phosphor-icons/react";

// List of tools that require human confirmation
const toolsRequiringConfirmation: (keyof typeof tools)[] = [];

export default function Chat() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [showDebug, setShowDebug] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const agent = useAgent({
    agent: "chat"
  });

  const [agentInput, setAgentInput] = useState("");
  const handleAgentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAgentInput(e.target.value);
  };

  const handleAgentSubmit = async (
    e: React.FormEvent,
    extraData: Record<string, unknown> = {}
  ) => {
    e.preventDefault();
    if (!agentInput.trim()) return;

    const message = agentInput;
    setAgentInput("");

    await sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: message }]
      },
      {
        body: extraData
      }
    );
  };

  const {
    messages: agentMessages,
    addToolResult,
    clearHistory,
    status,
    sendMessage,
    stop
  } = useAgentChat<unknown, UIMessage<{ createdAt: string }>>({
    agent
  });

  useEffect(() => {
    agentMessages.length > 0 && scrollToBottom();
  }, [agentMessages, scrollToBottom]);

  const pendingToolCallConfirmation = agentMessages.some((m: UIMessage) =>
    m.parts?.some(
      (part) =>
        isToolUIPart(part) &&
        part.state === "input-available" &&
        toolsRequiringConfirmation.includes(
          part.type.replace("tool-", "") as keyof typeof tools
        )
    )
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-[100vh] w-full flex justify-center items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-neutral-950 dark:via-slate-900 dark:to-neutral-900 overflow-hidden">
      <HasOpenAIKey />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-400/10 dark:bg-violet-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="h-[calc(100vh-2rem)] w-full mx-2 max-w-[98vw] flex flex-col shadow-2xl rounded-2xl overflow-hidden relative backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/50 dark:border-neutral-700/50">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/50 flex items-center gap-4 bg-gradient-to-r from-white/50 to-white/30 dark:from-neutral-900/50 dark:to-neutral-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-center h-10 w-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg transform transition-transform hover:scale-110">
            <svg
              width="24px"
              height="24px"
              className="text-white"
              data-icon="agents"
            >
              <title>Cloudflare Agents</title>
              <symbol id="ai:local:agents" viewBox="0 0 80 79">
                <path
                  fill="currentColor"
                  d="M69.3 39.7c-3.1 0-5.8 2.1-6.7 5H48.3V34h4.6l4.5-2.5c1.1.8 2.5 1.2 3.9 1.2 3.8 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7c0 .9.2 1.8.5 2.6L51.9 30h-3.5V18.8h-.1c-1.3-1-2.9-1.6-4.5-1.9h-.2c-1.9-.3-3.9-.1-5.8.6-.4.1-.8.3-1.2.5h-.1c-.1.1-.2.1-.3.2-1.7 1-3 2.4-4 4 0 .1-.1.2-.1.2l-.3.6c0 .1-.1.1-.1.2v.1h-.6c-2.9 0-5.7 1.2-7.7 3.2-2.1 2-3.2 4.8-3.2 7.7 0 .7.1 1.4.2 2.1-1.3.9-2.4 2.1-3.2 3.5s-1.2 2.9-1.4 4.5c-.1 1.6.1 3.2.7 4.7s1.5 2.9 2.6 4c-.8 1.8-1.2 3.7-1.1 5.6 0 1.9.5 3.8 1.4 5.6s2.1 3.2 3.6 4.4c1.3 1 2.7 1.7 4.3 2.2v-.1q2.25.75 4.8.6h.1c0 .1.1.1.1.1.9 1.7 2.3 3 4 4 .1.1.2.1.3.2h.1c.4.2.8.4 1.2.5 1.4.6 3 .8 4.5.7.4 0 .8-.1 1.3-.1h.1c1.6-.3 3.1-.9 4.5-1.9V62.9h3.5l3.1 1.7c-.3.8-.5 1.7-.5 2.6 0 3.8 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7c-1.5 0-2.8.5-3.9 1.2l-4.6-2.5h-4.6V48.7h14.3c.9 2.9 3.5 5 6.7 5 3.8 0 7-3.1 7-7s-3.1-7-7-7m-7.9-16.9c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3m0 41.4c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3M44.3 72c-.4.2-.7.3-1.1.3-.2 0-.4.1-.5.1h-.2c-.9.1-1.7 0-2.6-.3-1-.3-1.9-.9-2.7-1.7-.7-.8-1.3-1.7-1.6-2.7l-.3-1.5v-.7q0-.75.3-1.5c.1-.2.1-.4.2-.7s.3-.6.5-.9c0-.1.1-.1.1-.2.1-.1.1-.2.2-.3s.1-.2.2-.3c0 0 0-.1.1-.1l.6-.6-2.7-3.5c-1.3 1.1-2.3 2.4-2.9 3.9-.2.4-.4.9-.5 1.3v.1c-.1.2-.1.4-.1.6-.3 1.1-.4 2.3-.3 3.4-.3 0-.7 0-1-.1-2.2-.4-4.2-1.5-5.5-3.2-1.4-1.7-2-3.9-1.8-6.1q.15-1.2.6-2.4l.3-.6c.1-.2.2-.4.3-.5 0 0 0-.1.1-.1.4-.7.9-1.3 1.5-1.9 1.6-1.5 3.8-2.3 6-2.3q1.05 0 2.1.3v-4.5c-.7-.1-1.4-.2-2.1-.2-1.8 0-3.5.4-5.2 1.1-.7.3-1.3.6-1.9 1s-1.1.8-1.7 1.3c-.3.2-.5.5-.8.8-.6-.8-1-1.6-1.3-2.6-.2-1-.2-2 0-2.9.2-1 .6-1.9 1.3-2.6.6-.8 1.4-1.4 2.3-1.8l1.8-.9-.7-1.9c-.4-1-.5-2.1-.4-3.1s.5-2.1 1.1-2.9q.9-1.35 2.4-2.1c.9-.5 2-.8 3-.7.5 0 1 .1 1.5.2 1 .2 1.8.7 2.6 1.3s1.4 1.4 1.8 2.3l4.1-1.5c-.9-2-2.3-3.7-4.2-4.9q-.6-.3-.9-.6c.4-.7 1-1.4 1.6-1.9.8-.7 1.8-1.1 2.9-1.3.9-.2 1.7-.1 2.6 0 .4.1.7.2 1.1.3V72zm25-22.3c-1.6 0-3-1.3-3-3 0-1.6 1.3-3 3-3s3 1.3 3 3c0 1.6-1.3 3-3 3"
                />
              </symbol>
              <use href="#ai:local:agents" />
            </svg>
          </div>

          <div className="flex-1">
            <h2 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              ECE Upperclassman
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Your friendly academic advisor</p>
          </div>

          <Button
            variant="ghost"
            size="md"
            shape="square"
            className="rounded-xl h-10 w-10 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
          </Button>

          <Button
            variant="ghost"
            size="md"
            shape="square"
            className="rounded-xl h-10 w-10 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
            onClick={clearHistory}
          >
            <Trash size={20} />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 max-h-[calc(100vh-12rem)] scroll-smooth">
          {agentMessages.length === 0 && (
            <div className="h-full flex items-center justify-center animate-in fade-in duration-500">
              <Card className="p-8 max-w-md mx-auto bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border-2 border-neutral-200/50 dark:border-neutral-700/50 shadow-xl">
                <div className="text-center space-y-5">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-2xl p-4 inline-flex shadow-lg animate-bounce">
                    <Robot size={32} weight="duotone" />
                  </div>
                  <h3 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    Ask An Upperclassman!
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
                    Start a conversation and get advice from someone who's been there.
                  </p>
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      Try asking about:
                    </p>
                    <ul className="text-sm space-y-2.5">
                      <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors">
                        <span className="text-purple-500 text-lg">📚</span>
                        <span className="text-neutral-700 dark:text-neutral-200">Hard courses and survival tips</span>
                      </li>
                      <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors">
                        <span className="text-purple-500 text-lg">☕</span>
                        <span className="text-neutral-700 dark:text-neutral-200">Best study spots on campus</span>
                      </li>
                      <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors">
                        <span className="text-purple-500 text-lg">💡</span>
                        <span className="text-neutral-700 dark:text-neutral-200">Career advice and internships</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {agentMessages.map((m, index) => {
            const isUser = m.role === "user";
            const showAvatar =
              index === 0 || agentMessages[index - 1]?.role !== m.role;

            return (
              <div key={m.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {showDebug && (
                  <pre className="text-xs text-muted-foreground overflow-scroll mb-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                    {JSON.stringify(m, null, 2)}
                  </pre>
                )}
                <div
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {showAvatar && !isUser ? (
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md">
                          <Robot size={20} weight="duotone" className="text-white" />
                        </div>
                      </div>
                    ) : (
                      !isUser && <div className="w-10" />
                    )}

                    <div className="flex-1">
                      <div>
                        {m.parts?.map((part, i) => {
                          if (part.type === "text") {
                            return (
                              <div key={i}>
                                <Card
                                  className={`p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                                    isUser
                                      ? "bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-br-md shadow-lg shadow-purple-500/20"
                                      : "bg-white dark:bg-neutral-800 rounded-bl-md border border-neutral-200 dark:border-neutral-700 shadow-lg shadow-purple-500/10 dark:shadow-purple-500/20 ring-1 ring-purple-500/20"
                                  } ${
                                    part.text.startsWith("scheduled message")
                                      ? "ring-2 ring-purple-400/50"
                                      : ""
                                  } relative`}
                                >
                                  {part.text.startsWith(
                                    "scheduled message"
                                  ) && (
                                    <span className="absolute -top-3 -left-2 text-xl">
                                      🕒
                                    </span>
                                  )}
                                  <MemoizedMarkdown
                                    id={`${m.id}-${i}`}
                                    content={part.text.replace(
                                      /^scheduled message: /,
                                      ""
                                    )}
                                  />
                                </Card>
                                <p
                                  className={`text-xs text-neutral-400 dark:text-neutral-500 mt-2 flex items-center gap-1 ${
                                    isUser ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                                  {formatTime(
                                    m.metadata?.createdAt
                                      ? new Date(m.metadata.createdAt)
                                      : new Date()
                                  )}
                                </p>
                              </div>
                            );
                          }

                          if (isToolUIPart(part) && m.role === "assistant") {
                            const toolCallId = part.toolCallId;
                            const toolName = part.type.replace("tool-", "");
                            const needsConfirmation =
                              toolsRequiringConfirmation.includes(
                                toolName as keyof typeof tools
                              );

                            return (
                              <div key={`${toolCallId}-${i}`} className="w-full max-w-[85%]">
                                <ToolInvocationCard
                                  toolUIPart={part}
                                  toolCallId={toolCallId}
                                  needsConfirmation={needsConfirmation}
                                  onSubmit={({ toolCallId, result }) => {
                                    addToolResult({
                                      tool: part.type.replace("tool-", ""),
                                      toolCallId,
                                      output: result
                                    });
                                  }}
                                  addToolResult={(toolCallId, result) => {
                                    addToolResult({
                                      tool: part.type.replace("tool-", ""),
                                      toolCallId,
                                      output: result
                                    });
                                  }}
                                />
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl absolute bottom-0 left-0 right-0 z-10 border-t border-neutral-200/50 dark:border-neutral-700/50"
        >
          <div className="flex items-end gap-3 mx-auto w-full">
            <div className="flex-1 relative">
              <Textarea
                disabled={pendingToolCallConfirmation}
                placeholder={
                  pendingToolCallConfirmation
                    ? "Please respond to the tool confirmation above..."
                    : "Type your message..."
                }
                className="w-full border-2 border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 dark:focus:border-purple-400 disabled:cursor-not-allowed disabled:opacity-50 min-h-[52px] max-h-[calc(60dvh)] overflow-hidden resize-none bg-white dark:bg-neutral-800 shadow-sm transition-all duration-200 pr-14 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                value={agentInput}
                onChange={(e) => {
                  handleAgentInputChange(e);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  setTextareaHeight(`${e.target.scrollHeight}px`);
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing &&
                    agentInput.trim() &&
                    !pendingToolCallConfirmation
                  ) {
                    e.preventDefault();
                    handleAgentSubmit(e as unknown as React.FormEvent, {
                      annotations: {
                        hello: "world"
                      }
                    });
                    setTextareaHeight("auto");
                  }
                }}
                rows={1}
                style={{ height: textareaHeight }}
              />
              <div className="absolute bottom-2 right-2">
                {status === "submitted" || status === "streaming" ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="inline-flex items-center justify-center rounded-xl p-2.5 bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    aria-label="Stop generation"
                  >
                    <Stop size={18} weight="fill" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      if (!agentInput.trim() || pendingToolCallConfirmation) return;
                      handleAgentSubmit(e as unknown as React.FormEvent, {
                        annotations: {
                          hello: "world"
                        }
                      });
                      setTextareaHeight("auto");
                    }}
                    className={`inline-flex items-center justify-center rounded-xl p-2.5 shadow-lg transition-all duration-200 transform ${
                      !agentInput.trim() || pendingToolCallConfirmation
                        ? "bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed"
                        : "bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105"
                    }`}
                    disabled={pendingToolCallConfirmation || !agentInput.trim()}
                    aria-label="Send message"
                  >
                    <PaperPlaneTilt size={18} weight="fill" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const hasOpenAiKeyPromise = fetch("/check-open-ai-key").then((res) =>
  res.json<{ success: boolean }>()
);

function HasOpenAIKey() {
  const hasOpenAiKey = use(hasOpenAiKeyPromise);

  if (!hasOpenAiKey.success) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border-2 border-red-200 dark:border-red-800 p-5 animate-in slide-in-from-top duration-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-labelledby="warningIcon"
                >
                  <title id="warningIcon">Warning Icon</title>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                  OpenAI API Key Not Configured
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-2 leading-relaxed">
                  Requests to the API, including from the frontend UI, will not
                  work until an OpenAI API key is configured.
                </p>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Please configure an OpenAI API key by setting a{" "}
                  <a
                    href="https://developers.cloudflare.com/workers/configuration/secrets/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  >
                    secret
                  </a>{" "}
                  named{" "}
                  <code className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-lg text-red-600 dark:text-red-400 font-mono text-sm font-semibold">
                    OPENAI_API_KEY
                  </code>
                  . <br />
                  You can also use a different model provider by following these{" "}
                  <a
                    href="https://github.com/cloudflare/agents-starter?tab=readme-ov-file#use-a-different-ai-model-provider"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  >
                    instructions
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}