import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { isNativeApp } from '@/lib/environment'
import { parseOptionalSshPort } from '@/lib/remote-connections'
import { useServerConnectionSnapshots } from '@/lib/server-connections'
import { useSaveServerProject } from '@/services/projects'
import type { Project } from '@/types/projects'
import { LOCAL_SERVER_ID } from '@/types/server-resource'

interface ServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Server to edit (undefined = add a new server) */
  project?: Project
}

export function ServerDialog({
  open,
  onOpenChange,
  project,
}: ServerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <ServerForm project={project} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ServerForm({
  project,
  onDone,
}: {
  project?: Project
  onDone: () => void
}) {
  const saveServer = useSaveServerProject()
  const snapshots = useServerConnectionSnapshots()
  // The Jean that stores a new server runs its sessions with its own backends.
  const jeans = [...snapshots.values()].filter(
    snapshot => snapshot.status === 'local' || snapshot.status === 'online'
  )
  const showRunFrom = !project && isNativeApp() && jeans.length > 1
  const [form, setForm] = useState({
    name: project?.name ?? '',
    user: project?.server?.user ?? '',
    host: project?.server?.host ?? '',
    port: project?.server?.port ? String(project.server.port) : '',
    runFrom: LOCAL_SERVER_ID as string,
  })
  const [error, setError] = useState<string | null>(null)

  const update = (key: keyof typeof form) => (value: string) =>
    setForm(current => ({ ...current, [key]: value }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    let port: number | undefined
    try {
      port = parseOptionalSshPort(form.port)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return
    }
    saveServer.mutate(
      {
        projectId: project?.id,
        name: form.name,
        server: {
          host: form.host.trim(),
          user: form.user.trim() || null,
          port: port ?? null,
        },
        serverId: form.runFrom,
      },
      { onSuccess: onDone }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{project ? 'Edit server' : 'Add server'}</DialogTitle>
        <DialogDescription>
          The AI connects with <code>ssh</code> from the machine that runs Jean.
          Use SSH key auth (no password prompt). Sessions start in Supervised
          mode, so you approve each command.
        </DialogDescription>
      </DialogHeader>
      <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Recommended: give Jean its own user with restricted sudo, not root.
        After you add the server, use the shield button in the Servers list.
        Jean connects once as root, creates the user, and adds your public key.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="server-name">Name</Label>
        <Input
          id="server-name"
          value={form.name}
          onChange={event => update('name')(event.target.value)}
          placeholder="Production"
        />
      </div>
      <div className="grid grid-cols-[1fr_1.5fr] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="server-user">SSH user</Label>
          <Input
            id="server-user"
            value={form.user}
            onChange={event => update('user')(event.target.value)}
            placeholder="root"
            autoComplete="username"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="server-host">Host / IP</Label>
          <Input
            id="server-host"
            value={form.host}
            onChange={event => update('host')(event.target.value)}
            placeholder="192.168.1.50"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1.5fr] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="server-port">SSH port</Label>
          <Input
            id="server-port"
            type="number"
            min={1}
            max={65535}
            value={form.port}
            onChange={event => update('port')(event.target.value)}
            placeholder="22"
          />
        </div>
        {showRunFrom && (
          <div className="space-y-1.5">
            <Label htmlFor="server-run-from">Run from</Label>
            <NativeSelect
              id="server-run-from"
              className="w-full"
              value={form.runFrom}
              onChange={event => update('runFrom')(event.target.value)}
            >
              {jeans.map(snapshot => (
                <NativeSelectOption
                  key={snapshot.serverId}
                  value={snapshot.serverId}
                >
                  {snapshot.serverId === LOCAL_SERVER_ID
                    ? 'This computer'
                    : snapshot.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>
      {showRunFrom && (
        <p className="text-xs text-muted-foreground">
          The Jean you pick stores the server, connects with its own SSH keys,
          and runs the chat with its own AI backends.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveServer.isPending || !form.host}>
          {project ? 'Save' : 'Add server'}
        </Button>
      </DialogFooter>
    </form>
  )
}
