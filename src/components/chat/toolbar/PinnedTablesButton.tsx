import { useEffect, useState } from 'react'
import { PinTack } from '@/components/icons/reicon'
import {
  Dialog,
  DialogContent,
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

interface PinnedTablesButtonProps {
  sessionId: string | null | undefined
}

/** Toolbar button that opens the session's pinned tables in a modal. */
export function PinnedTablesButton({ sessionId }: PinnedTablesButtonProps) {
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

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Pinned tables (${count})`}
            className="flex h-8 shrink-0 items-center gap-1 px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <PinTack className="h-3.5 w-3.5" weight="Filled" />
            <span>{count}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Pinned tables</TooltipContent>
      </Tooltip>
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="!w-screen !h-dvh !max-w-screen !max-h-none !rounded-none sm:!w-[calc(100vw-8rem)] sm:!max-w-[calc(100vw-8rem)] sm:!h-[calc(100vh-8rem)] sm:!rounded-lg flex flex-col">
          <DialogHeader className="text-left pr-10">
            <DialogTitle className="flex items-center gap-2">
              <PinTack className="h-4 w-4" weight="Filled" />
              Pinned tables ({count})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className={isMobile ? 'p-4 text-sm' : 'p-4'}>
              {pins?.map(pin => (
                <Markdown
                  key={pin.key}
                  sessionId={sessionId}
                  tableKey={pin.key}
                  compact={isMobile}
                >
                  {pin.markdown}
                </Markdown>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
