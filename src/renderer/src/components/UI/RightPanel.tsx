import { useState, useEffect, useRef } from 'react'
import {
  RiBrainLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiShieldCheckLine,
  RiAlertLine
} from 'react-icons/ri'

interface Message {
  role: 'user' | 'model' | 'system'
  text: string
  thought?: string
}

function ThoughtCard({ thought }: { thought: string }) {
  const [expanded, setExpanded] = useState(true)

  const isCritical = thought.includes('CRITICAL') || thought.includes('INTERCEPTED')
  const isMedium = thought.includes('MEDIUM') || thought.includes('HIGH')

  return (
    <div
      className={`mb-2.5 rounded-xl border transition-all text-xs font-mono overflow-hidden ${
        isCritical
          ? 'bg-red-950/20 border-red-500/30'
          : isMedium
            ? 'bg-amber-950/20 border-amber-500/30'
            : 'bg-emerald-950/20 border-emerald-500/20'
      }`}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3 py-2 bg-black/40 cursor-pointer hover:bg-white/5 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <RiBrainLine
            size={14}
            className={
              isCritical ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
            }
          />
          <span className="font-bold tracking-wider text-[11px] uppercase text-zinc-300">
            Cognitive Loop Reflection
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
              isCritical
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : isMedium
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isCritical ? 'Hazard Intercepted' : isMedium ? 'Risk Evaluated' : 'Safe Op Approved'}
          </span>
        </div>
        <button className="text-zinc-500 hover:text-zinc-300">
          {expanded ? <RiArrowDownSLine size={16} /> : <RiArrowRightSLine size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="p-3 bg-black/60 text-[11px] leading-relaxed text-zinc-300 border-t border-white/5 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto scrollbar-small">
          {thought}
        </div>
      )}
    </div>
  )
}

function parseMessageContent(rawText: string): { thought?: string; cleanText: string } {
  if (!rawText.includes('<agentic_thought>')) {
    return { cleanText: rawText }
  }

  const startIdx = rawText.indexOf('<agentic_thought>')
  const endIdx = rawText.indexOf('</agentic_thought>')

  if (startIdx !== -1 && endIdx !== -1) {
    const thought = rawText.substring(startIdx + '<agentic_thought>'.length, endIdx).trim()
    const cleanText = (rawText.substring(0, startIdx) + rawText.substring(endIdx + '</agentic_thought>'.length)).trim()
    return { thought, cleanText }
  }

  return { cleanText: rawText }
}

export default function RightPanel() {
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: 'system',
      text: 'Neural Operating Layer active. Agentic Cognitive Reflection Loop & Safe Blast-Radius Gate armed.',
      thought: `1. [Intent & Context Deconstruction]
   • Intent: "Initialize OS Workspace & Agentic Guardrails"
   • Focused Target: Local Workstation Environment
   • Target Resources: [Process Tree, Memory, Local Vault]

2. [Blast Radius & Hazard Deduction]
   • Hazard Level: NONE
   • Destructive: NO (State initialization)
   • Reversibility: REVERSIBLE

3. [Critique & Self-Correction]
   • Impulse Critique: Safe initialization sequence.
   • Engine Self-Reflection: Zero-trust safeStorage unlocked, Ollama edge model online.

4. [Action & Strategy Decision]
   • Approved: YES (Proceed)
   • Plan: Standby for voice or keyboard directives.`
    }
  ])
  const [activeModelText, setActiveModelText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleCognitiveLog = (event: any) => {
      const evaluation = event.detail
      if (evaluation && evaluation.rawThoughtText) {
        const { thought } = parseMessageContent(evaluation.rawThoughtText)
        const summaryMsg: Message = {
          role: 'model',
          text: evaluation.phase4_action_strategy?.confirmationMessage ||
            `Cognitive evaluation completed for intent: "${evaluation.phase1_deconstruction?.intent}". Hazard Level: ${evaluation.phase2_blast_radius?.hazardLevel}. Status: ${evaluation.phase4_action_strategy?.approved ? 'APPROVED' : 'BLOCKED'}.`,
          thought
        }
        setChatHistory((prev) => [...prev, summaryMsg].slice(-40))
      }
    }

    window.addEventListener('ai-cognitive-log', handleCognitiveLog)
    return () => window.removeEventListener('ai-cognitive-log', handleCognitiveLog)
  }, [])

  useEffect(() => {
    const loadHistory = async () => {
      if ((window as any).iris?.getHistory) {
        try {
          const pastMemories = await (window as any).iris.getHistory()
          const recentMemories: Message[] = pastMemories.slice(-30).map((m: any) => {
            const parsed = parseMessageContent(m.text)
            return {
              role: m.role.toLowerCase() as 'user' | 'model' | 'system',
              text: parsed.cleanText || m.text,
              thought: parsed.thought
            }
          })
          setChatHistory((prev) => [...prev, ...recentMemories].slice(-40))
        } catch (err) {
          console.error('Failed to load history', err)
        }
      }
    }
    loadHistory()

    if ((window as any).iris) {
      ;(window as any).iris.onTranscript(
        (data: { role: string; text: string; isFinal: boolean }) => {
          if (data.role === 'user') {
            const parsed = parseMessageContent(data.text)
            const newMessage: Message = {
              role: 'user',
              text: parsed.cleanText || data.text,
              thought: parsed.thought
            }
            setChatHistory((prev) => [...prev, newMessage].slice(-40))
          } else if (data.role === 'model') {
            setActiveModelText((prev) => prev + data.text)
          }
        }
      )
      ;(window as any).iris.onTranscriptComplete(() => {
        setActiveModelText((prev) => {
          if (prev.trim().length > 0) {
            const parsed = parseMessageContent(prev.trim())
            const newMessage: Message = {
              role: 'model',
              text: parsed.cleanText || prev.trim(),
              thought: parsed.thought
            }
            setChatHistory((history) => [...history, newMessage].slice(-40))
          }
          return ''
        })
      })
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory, activeModelText])

  return (
    <div className="h-full min-h-0 flex flex-col bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <RiShieldCheckLine className="text-emerald-400" size={16} />
          <h2 className="text-sm font-semibold text-white/90 tracking-wide">
            Cognitive Stream & Telemetry
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-medium text-emerald-400/90">Cognitive Armed</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 p-4 overflow-y-auto flex flex-col gap-4 scroll-smooth
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/10
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/40"
      >
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* If there is a thought block, render it */}
            {msg.thought && (
              <div className="w-full max-w-[95%]">
                <ThoughtCard thought={msg.thought} />
              </div>
            )}

            {/* Message Body */}
            {msg.text && (
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg font-sans ${
                  msg.role === 'user'
                    ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30 rounded-br-md'
                    : msg.role === 'system'
                      ? 'bg-zinc-900/80 text-zinc-300 border border-white/10 rounded-xl font-mono text-[11px]'
                      : 'bg-zinc-900/60 text-zinc-100 border border-white/10 rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}

        {activeModelText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3.5 rounded-2xl bg-zinc-900/60 text-gray-200 border border-white/10 rounded-bl-md text-xs leading-relaxed shadow-lg">
              {activeModelText}
              <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 rounded-full animate-pulse align-middle"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}