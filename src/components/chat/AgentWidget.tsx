import { useEffect, useState } from 'react'
import { ChevronDown, Users, X } from '@/components/icons/reicon'
import type { SubAgent } from '@/types/chat'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface AgentWidgetProps {
  agents: SubAgent[]
  className?: string
  /** Callback to dismiss the widget */
  onClose?: () => void
  /** Whether to start expanded (default: true) */
  defaultOpen?: boolean
}

/**
 * Client-side run timings keyed by agent id. Module scope so the timings
 * survive remounts (session switch, layout change). Agents first seen after
 * they finished (e.g. restored history) have no timing.
 */
const agentTimings = new Map<string, { start: number; end?: number }>()

function trackTiming(agent: SubAgent, now: number) {
  const timing = agentTimings.get(agent.id)
  if (agent.status === 'in_progress') {
    if (!timing) agentTimings.set(agent.id, { start: now })
  } else if (timing && timing.end === undefined) {
    timing.end = now
  }
}

export function formatAgentElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * Collapsible "Subagents" panel shown above the chat input.
 * Lists Claude Task/Agent and Codex multi-agent runs with live status.
 */
export function AgentWidget({
  agents,
  className,
  onClose,
  defaultOpen = true,
}: AgentWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [now, setNow] = useState(() => Date.now())

  const runningCount = agents.filter(a => a.status === 'in_progress').length
  const completedCount = agents.filter(a => a.status === 'completed').length

  for (const agent of agents) trackTiming(agent, now)

  // Tick once per second while any agent runs, for the elapsed time
  useEffect(() => {
    if (runningCount === 0) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [runningCount])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="border-t border-border bg-card sm:rounded-lg sm:border">
        <div className="flex items-center gap-2 px-4 py-2 text-sm">
          <CollapsibleTrigger className="flex flex-1 min-w-0 items-center gap-2 select-none text-left">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">Subagents</span>
            <span className="text-xs text-muted-foreground">
              {runningCount > 0
                ? `${runningCount} running`
                : `${completedCount}/${agents.length} done`}
            </span>
            <ChevronDown
              className={cn(
                'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </CollapsibleTrigger>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 rounded text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Dismiss subagents"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <CollapsibleContent>
          <ul className="max-h-48 overflow-y-auto px-4 pb-2.5 space-y-1.5">
            {agents.map(agent => (
              <AgentItem key={agent.id} agent={agent} now={now} />
            ))}
          </ul>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

interface AgentItemProps {
  agent: SubAgent
  now: number
}

function AgentItem({ agent, now }: AgentItemProps) {
  const timing = agentTimings.get(agent.id)
  const elapsed = timing
    ? formatAgentElapsed((timing.end ?? now) - timing.start)
    : null
  const meta = [
    agent.toolCount
      ? `${agent.toolCount} tool${agent.toolCount === 1 ? '' : 's'}`
      : null,
    elapsed,
  ].filter(Boolean)
  const isDone = agent.status !== 'in_progress'

  return (
    <li
      className="flex min-w-0 items-center gap-2 text-xs"
      title={agent.message}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          agent.status === 'in_progress' && 'bg-primary animate-pulse',
          agent.status === 'completed' && 'bg-success',
          agent.status === 'errored' && 'bg-warning',
          agent.status === 'interrupted' && 'bg-muted-foreground/60'
        )}
        aria-label={agent.status.replace('_', ' ')}
      />
      <span
        className={cn(
          'flex min-w-0 items-center gap-1.5',
          isDone && 'text-muted-foreground/70'
        )}
      >
        {agent.label && (
          <>
            <span className="shrink-0 font-semibold">{agent.label}</span>
            <span className="shrink-0 text-muted-foreground/60">›</span>
          </>
        )}
        <span className="truncate text-muted-foreground">
          {agent.prompt}
          {agent.status === 'interrupted' && (
            <span className="ml-1 text-[10px] uppercase tracking-wide">
              Interrupted
            </span>
          )}
        </span>
      </span>
      {meta.length > 0 && (
        <span className="ml-auto shrink-0 pl-2 tabular-nums text-muted-foreground">
          {meta.join(' • ')}
        </span>
      )}
    </li>
  )
}
