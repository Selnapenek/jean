import { toast } from 'sonner'
import { invoke } from '@/lib/transport'
import { useChatStore } from '@/store/chat-store'
import type { SaveTextResponse } from '@/types/chat'

function escapeCell(cell: string): string {
  return cell.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')
}

/** Render table data (first row = header) as a GFM markdown table. */
export function tableToMarkdown(data: string[][]): string {
  const [header, ...rows] = data
  if (!header) return ''
  const line = (cells: string[]) => `| ${cells.map(escapeCell).join(' | ')} |`
  const separator = `| ${header.map(() => '---').join(' | ')} |`
  return [line(header), separator, ...rows.map(line)].join('\n')
}

/** Chip content: the header row plus the picked body rows, in table order. */
export function formatTableRowsPrompt(
  data: string[][],
  rows: number[]
): string {
  const [header, ...body] = data
  if (!header) return ''
  const picked = rows.flatMap(i => (body[i] ? [body[i]] : []))
  return `Rows referenced from a table in this chat:\n\n${tableToMarkdown([header, ...picked])}\n`
}

/** Next picked rows after toggling `rowIndex`, kept in table order. */
export function toggleRowIndex(rows: number[], rowIndex: number): number[] {
  return rows.includes(rowIndex)
    ? rows.filter(r => r !== rowIndex)
    : [...rows, rowIndex].sort((a, b) => a - b)
}

// One operation chain per table, so fast clicks cannot create two chips.
const chains = new Map<string, Promise<void>>()

async function applyToggle(
  sessionId: string,
  tableKey: string,
  rowIndex: number,
  data: string[][]
): Promise<void> {
  const existing = useChatStore
    .getState()
    .pendingTextFiles[
      sessionId
    ]?.find(tf => tf.tableRows?.tableKey === tableKey)
  const rows = toggleRowIndex(existing?.tableRows?.rows ?? [], rowIndex)

  if (existing && rows.length === 0) {
    useChatStore.getState().removePendingTextFile(sessionId, existing.id)
    await invoke('delete_pasted_text', { path: existing.path, sessionId })
    return
  }

  const content = formatTableRowsPrompt(data, rows)
  if (existing) {
    const size = await invoke<number>('update_pasted_text', {
      path: existing.path,
      content,
      sessionId,
    })
    useChatStore
      .getState()
      .updatePendingTextFile(sessionId, existing.id, content, size, {
        tableKey,
        rows,
      })
    return
  }

  const result = await invoke<SaveTextResponse>('save_pasted_text', {
    content,
    filename: 'table-rows',
    sessionId,
  })
  useChatStore.getState().addPendingTextFile(sessionId, {
    ...result,
    content,
    tableRows: { tableKey, rows },
  })
}

/**
 * Add or remove one table body row in the table's prompt chip. The first row
 * creates the chip; removing the last row deletes it.
 */
export function toggleTableRowInPrompt(
  sessionId: string,
  tableKey: string,
  rowIndex: number,
  data: string[][]
): Promise<void> {
  const chainKey = `${sessionId}:${tableKey}`
  const next = (chains.get(chainKey) ?? Promise.resolve())
    .then(() => applyToggle(sessionId, tableKey, rowIndex, data))
    .catch(error => {
      toast.error('Failed to update table rows in prompt', {
        description: String(error),
      })
    })
  chains.set(chainKey, next)
  void next.finally(() => {
    if (chains.get(chainKey) === next) chains.delete(chainKey)
  })
  return next
}
