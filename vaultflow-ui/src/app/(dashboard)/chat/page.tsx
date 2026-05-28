'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { chatWithAI } from '@/lib/api'
import type { ChatMessage } from '@/types'
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react'

const SUGGESTIONS = [
  'What is my current balance?',
  'Explain how transfers work',
  'What does the fraud detection flag?',
  'How is my spending categorized?',
]

export default function ChatPage() {
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { reply } = await chatWithAI(text)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err: unknown) {
      const msg = (err as { status?: number })?.status === 503
        ? 'AI assistant is unavailable. Set GROQ_API_KEY to enable it.'
        : 'Something went wrong. Please try again.'
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">AI Financial Assistant</h1>
            <p className="text-xs text-slate-500">Powered by Groq · llama-3.3-70b</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Ask me anything about VaultFlow</h2>
              <p className="mt-1 text-sm text-slate-500">I can help you understand your accounts, transactions, and fraud alerts.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-200'}`}>
              {msg.role === 'user'
                ? <User className="h-4 w-4 text-white" />
                : <Bot className="h-4 w-4 text-slate-600" />}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'rounded-br-sm bg-blue-600 text-white'
                  : 'rounded-bl-sm bg-white border border-slate-200 text-slate-800 shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
              <Bot className="h-4 w-4 text-slate-600" />
            </div>
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your accounts, transactions, or anything banking…"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
