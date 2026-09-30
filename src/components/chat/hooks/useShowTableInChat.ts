import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chatQueryKeys, useLoadOlderMessages } from '@/services/chat'
import {
  REVEAL_CHAT_MESSAGE_EVENT,
  findTableMessageIndex,
  scrollToRenderedTable,
  type RevealChatMessageDetail,
} from '@/lib/pinned-table-reveal'
import type { Session } from '@/types/chat'
import type { VirtualizedMessageListHandle } from '../VirtualizedMessageList'

interface ShowTableInChatOptions {
  sessionId: string | null | undefined
  isCompact: boolean
  /** First message index shown while compact history is collapsed */
  compactStartIndex: number
  isCompactHistoryExpanded: boolean
  onExpandCompactHistory: () => void
  listRef: RefObject<VirtualizedMessageListHandle | null>
}

const nextFrame = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

async function afterRender() {
  await nextFrame()
  await nextFrame()
}

/**
 * Scroll to a pinned table in the chat. Loads older runs from disk, expands
 * hidden compact prompts, and opens the compact activity row when the table is
 * not rendered yet.
 */
export function useShowTableInChat(options: ShowTableInChatOptions) {
  const queryClient = useQueryClient()
  const { mutateAsync: loadOlder } = useLoadOlderMessages()
  const latest = useRef(options)
  useLayoutEffect(() => {
    latest.current = options
  })

  return useCallback(
    async (tableKey: string) => {
      const { sessionId } = latest.current
      if (!sessionId) return
      const readSession = () =>
        queryClient.getQueryData<Session>(chatQueryKeys.session(sessionId))
      let session = readSession()
      let index = findTableMessageIndex(session?.messages ?? [], tableKey)
      const loadedId = session?.messages[index]?.id ?? null
      if (await scrollToRenderedTable(tableKey, loadedId, 0)) return

      try {
        while (index < 0 && (session?.loaded_run_start_index ?? 0) > 0) {
          const before = session?.loaded_run_start_index ?? 0
          await loadOlder({ sessionId, beforeRunIndex: before })
          session = readSession()
          if ((session?.loaded_run_start_index ?? 0) === before) break
          index = findTableMessageIndex(session?.messages ?? [], tableKey)
        }
      } catch (error) {
        toast.error('Failed to load older messages', {
          description: String(error),
        })
        return
      }

      const message = session?.messages[index]
      if (!message) {
        toast.info('The message with this table is no longer in the chat')
        return
      }

      // Let older messages render so compact window values are current.
      await afterRender()
      const {
        isCompact,
        compactStartIndex,
        isCompactHistoryExpanded,
        onExpandCompactHistory,
      } = latest.current
      const compactWindowed = isCompact && !isCompactHistoryExpanded
      if (compactWindowed && index < compactStartIndex) {
        onExpandCompactHistory()
        await afterRender()
      }

      window.dispatchEvent(
        new CustomEvent<RevealChatMessageDetail>(REVEAL_CHAT_MESSAGE_EVENT, {
          detail: { messageId: message.id },
        })
      )
      const listIndex =
        compactWindowed && index >= compactStartIndex
          ? index - compactStartIndex
          : index
      latest.current.listRef.current?.scrollToIndex(listIndex)

      if (!(await scrollToRenderedTable(tableKey, message.id, 2000))) {
        toast.info('Could not find this table in the chat')
      }
    },
    [queryClient, loadOlder]
  )
}
