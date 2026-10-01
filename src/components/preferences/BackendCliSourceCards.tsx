import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface BackendCliSourceCardsProps {
  value: 'jean' | 'path'
  onValueChange: (value: 'jean' | 'path') => void
  backendName: string
  managedDescription?: string
  path: string | null | undefined
  pathVersion?: string | null
  pathFound: boolean
}

export function BackendCliSourceCards({
  value,
  onValueChange,
  backendName,
  managedDescription,
  path,
  pathVersion,
  pathFound,
}: BackendCliSourceCardsProps) {
  const sourceId = backendName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return (
    <RadioGroup
      value={value}
      onValueChange={next => {
        if (next === 'jean' || next === 'path') onValueChange(next)
      }}
      className="flex w-full flex-wrap items-center gap-x-6 gap-y-2"
    >
      <Label
        htmlFor={`${sourceId}-source-jean`}
        title={
          managedDescription ??
          `Jean installs and updates an isolated ${backendName} version.`
        }
        className="flex cursor-pointer items-center gap-2 text-sm font-normal"
      >
        <RadioGroupItem id={`${sourceId}-source-jean`} value="jean" />
        Jean managed
      </Label>
      <Label
        htmlFor={`${sourceId}-source-path`}
        title={pathFound ? (path ?? undefined) : `No ${backendName} on PATH`}
        className="flex min-w-0 cursor-pointer items-center gap-2 text-sm font-normal"
      >
        <RadioGroupItem
          id={`${sourceId}-source-path`}
          value="path"
          disabled={!pathFound}
        />
        <span>System PATH</span>
        <span className="text-xs text-muted-foreground">
          {pathFound ? pathVersion : 'not found'}
        </span>
      </Label>
    </RadioGroup>
  )
}
