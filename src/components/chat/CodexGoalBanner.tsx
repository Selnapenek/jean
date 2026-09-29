import { useCallback, useState } from 'react'
import { Flag } from '@/components/icons/reicon'
import { toast } from 'sonner'
import { invoke } from '@/lib/transport'
import { useChatStore } from '@/store/chat-store'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CodexGoalBannerProps {
  sessionId: string | null
  worktreeId: string | null
  worktreePath: string | null
  /** Only render for Codex and Claude sessions */
  isGoalBackend: boolean
  /**
   * Claude keeps its goal inside the CLI session, so clearing must go through
   * a chat turn instead of the Codex app-server RPC.
   */
  onClearClaudeGoal?: () => void | Promise<void>
}

export function CodexGoalBanner({
  sessionId,
  worktreeId,
  worktreePath,
  isGoalBackend,
  onClearClaudeGoal,
}: CodexGoalBannerProps) {
  const goal = useChatStore(state =>
    sessionId ? (state.codexGoals[sessionId] ?? null) : null
  )
  const [clearing, setClearing] = useState(false)
  const [open, setOpen] = useState(false)

  const handleClear = useCallback(async () => {
    if (!sessionId || !worktreeId || !worktreePath || clearing) return
    setClearing(true)
    try {
      await invoke('codex_goal_clear', {
        worktreeId,
        worktreePath,
        sessionId,
      })
      await onClearClaudeGoal?.()
      setOpen(false)
    } catch (err) {
      toast.error(`Failed to clear goal: ${err}`)
    } finally {
      setClearing(false)
    }
  }, [sessionId, worktreeId, worktreePath, clearing, onClearClaudeGoal])

  if (!isGoalBackend || !goal) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show goal"
          className="flex h-6 items-center gap-1 rounded-full border border-border/70 bg-background/90 py-0 pl-1.5 pr-2.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-muted hover:text-foreground"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Goal</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Goal
        </div>
        <div className="mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap break-words text-sm text-foreground">
          {goal}
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={clearing}
          >
            {clearing ? 'Clearing...' : 'Clear goal'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
