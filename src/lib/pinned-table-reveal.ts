/** Window event that asks compact activity rows to open for a message. */
export const REVEAL_CHAT_MESSAGE_EVENT = 'reveal-chat-message'

export interface RevealChatMessageDetail {
  messageId: string
}

function splitTableKey(tableKey: string): { prefix: string; offset: string } {
  const at = tableKey.lastIndexOf(':')
  return at < 0
    ? { prefix: tableKey, offset: '' }
    : { prefix: tableKey.slice(0, at), offset: tableKey.slice(at + 1) }
}

/**
 * Index of the message that holds a pinned table, or -1.
 *
 * Table keys are `<messageId>:<offset>`. Compact view surfaces the latest
 * reply of a group as `compact-<firstId>[-<lastId>]:<offset>`; that text comes
 * from the group's last message, so the latest matching message wins.
 */
export function findTableMessageIndex(
  messages: readonly { id: string }[],
  tableKey: string
): number {
  const { prefix } = splitTableKey(tableKey)
  const isCompact = prefix.startsWith('compact-')
  for (let i = messages.length - 1; i >= 0; i--) {
    const id = messages[i]?.id
    if (!id) continue
    if (prefix === id || (isCompact && prefix.endsWith(id))) return i
  }
  return -1
}

/**
 * True when a rendered table key shows the same table as `tableKey`. The same
 * table can render as `<messageId>:<offset>` (full message) or as
 * `compact-...<messageId>:<offset>` (compact view latest reply).
 */
export function isSameTableKey(
  candidate: string,
  tableKey: string,
  messageId: string | null
): boolean {
  if (candidate === tableKey) return true
  if (!messageId) return false
  const { offset } = splitTableKey(tableKey)
  const plain = `${messageId}:${offset}`
  return (
    candidate === plain ||
    (candidate.startsWith('compact-') && candidate.endsWith(plain))
  )
}

function findRenderedTable(
  tableKey: string,
  messageId: string | null
): HTMLElement | null {
  const tables = Array.from(
    document.querySelectorAll<HTMLElement>('[data-table-key]')
  ).filter(el => !el.closest('[role="dialog"]'))
  return (
    tables.find(el => el.dataset.tableKey === tableKey) ??
    tables.find(el =>
      isSameTableKey(el.dataset.tableKey ?? '', tableKey, messageId)
    ) ??
    null
  )
}

/**
 * Wait until the table renders in the chat, then scroll to it and flash it.
 * Returns false when it does not render within `timeoutMs`.
 */
export async function scrollToRenderedTable(
  tableKey: string,
  messageId: string | null,
  timeoutMs: number
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  let target = findRenderedTable(tableKey, messageId)
  while (!target && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50))
    target = findRenderedTable(tableKey, messageId)
  }
  if (!target) return false
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  target.classList.remove('pinned-table-highlight')
  void target.offsetWidth // restart the animation on repeat jumps
  target.classList.add('pinned-table-highlight')
  return true
}
