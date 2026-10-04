import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

interface BackendCliSourceCardsProps {
  value: 'jean' | 'path'
  onValueChange: (value: 'jean' | 'path') => void
  backendName: string
  managedDescription?: string
  path: string | null | undefined
  pathVersion?: string | null
  pathFound: boolean
  /** Optional control (e.g. Uninstall) aligned below the source options */
  action?: ReactNode
}

export function BackendCliSourceCards({
  value,
  onValueChange,
  backendName,
  managedDescription,
  path,
  pathVersion,
  pathFound,
  action,
}: BackendCliSourceCardsProps) {
  const sourceId = backendName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return (
    <RadioGroup
      value={value}
      onValueChange={next => {
        if (next === 'jean' || next === 'path') onValueChange(next)
      }}
      className="grid w-full gap-2 sm:w-80 sm:shrink-0 sm:grid-cols-2"
    >
      <Label
        htmlFor={`${sourceId}-source-jean`}
        title={
          managedDescription ??
          `Jean installs and updates an isolated ${backendName} version.`
        }
        className={cn(
          'flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-normal transition-colors hover:bg-accent',
          value === 'jean' ? 'border-primary bg-primary/5' : 'border-border'
        )}
      >
        <RadioGroupItem id={`${sourceId}-source-jean`} value="jean" />
        Jean managed
      </Label>
      <Label
        htmlFor={`${sourceId}-source-path`}
        title={pathFound ? (path ?? undefined) : `No ${backendName} on PATH`}
        className={cn(
          'flex min-w-0 items-center gap-2 rounded-lg border p-3 text-sm font-normal transition-colors',
          value === 'path' ? 'border-primary bg-primary/5' : 'border-border',
          pathFound ? 'cursor-pointer hover:bg-accent' : 'opacity-50'
        )}
      >
        <RadioGroupItem
          id={`${sourceId}-source-path`}
          value="path"
          disabled={!pathFound}
        />
        <span className="min-w-0">
          <span className="block">System PATH</span>
          <span className="block truncate text-xs text-muted-foreground">
            {pathFound ? pathVersion : 'not found'}
          </span>
        </span>
      </Label>
      {action && <div className="flex justify-end sm:col-span-2">{action}</div>}
    </RadioGroup>
  )
}
