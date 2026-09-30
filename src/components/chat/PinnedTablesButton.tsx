import { useEffect, useState } from 'react'
import { MessageSquare, PinTack } from '@/components/icons/reicon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Markdown } from '@/components/ui/markdown'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useChatStore } from '@/store/chat-store'
import { useUIStore } from '@/store/ui-store'
import { useIsMobile } from '@/hooks/use-mobile'

/** Column names of a markdown table, used as the pinned card title. */
export function pinnedTableTitle(markdown: string): string {
  const header = markdown.split('\n', 1)[0] ?? ''
  const cells = header
    .split(/(?<!\\)\|/)
    .map(cell => cell.replace(/[*_`]/g, '').trim())
    .filter(Boolean)
  return cells.join(' · ') || 'Table'
}

interface PinnedTablesButtonProps {
  sessionId: string | null | undefined
  /** Scroll the chat to the table, loading hidden history when needed */
  onShowInChat: (tableKey: string) => void
}

/**
 * Floating pill in the chat's top-right corner. Opens the session's pinned
 * tables, each on a card with a link back to its message.
 */
export function PinnedTablesButton({
  sessionId,
  onShowInChat,
}: PinnedTablesButtonProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const pins = useChatStore(state =>
    sessionId ? state.pinnedTables[sessionId] : undefined
  )
  const count = pins?.length ?? 0
  const isOpen = open && count > 0

  // Mark a nested viewer as open so Escape does not close the session modal.
  useEffect(() => {
    if (!isOpen) return
    useUIStore.getState().setContextViewerOpen(true)
    return () => useUIStore.getState().setContextViewerOpen(false)
  }, [isOpen])

  if (!sessionId || count === 0) return null

  const handleJump = (tableKey: string) => {
    setOpen(false)
    // Wait for the dialog to close so focus restore does not undo the scroll.
    setTimeout(() => onShowInChat(tableKey), 200)
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Pinned tables (${count})`}
            className="flex h-6 items-center gap-1 rounded-full border border-border/70 bg-background/90 py-0 pl-1.5 pr-2.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-muted hover:text-foreground sm:h-7 sm:pl-2 sm:pr-3"
          >
            <PinTack className="h-3.5 w-3.5" weight="Filled" />
            <span>{count}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Pinned tables</TooltipContent>
      </Tooltip>
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="!w-screen !h-dvh !max-w-screen !max-h-none !rounded-none !px-2 sm:!px-6 sm:!w-[calc(100vw-8rem)] sm:!max-w-[calc(100vw-8rem)] sm:!h-[calc(100vh-8rem)] sm:!rounded-lg flex flex-col">
          <DialogHeader className="text-left pl-2 pr-10 sm:pl-0">
            <DialogTitle className="flex items-center gap-2">
              <PinTack className="h-4 w-4" weight="Filled" />
              Pinned tables ({count})
            </DialogTitle>
            <DialogDescription className="sr-only">
              Tables pinned in this session.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 min-w-0">
            <div className="flex flex-col gap-4 pb-4 sm:px-2">
              {pins?.map(pin => (
                <section
                  key={pin.key}
                  className="rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {pinnedTableTitle(pin.markdown)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleJump(pin.key)}
                      className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Show in chat</span>
                    </button>
                  </div>
                  <div
                    className={
                      isMobile ? 'px-1 text-sm [&_td]:px-2 [&_th]:px-2' : 'px-3'
                    }
                  >
                    <Markdown
                      sessionId={sessionId}
                      tableKey={pin.key}
                      compact={isMobile}
                    >
                      {pin.markdown}
                    </Markdown>
                  </div>
                </section>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
