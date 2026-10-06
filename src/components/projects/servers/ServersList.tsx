import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Server, Shield, Trash2 } from '@/components/icons/reicon'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { isNativeApp } from '@/lib/environment'
import { cn } from '@/lib/utils'
import { openServerProject, useRemoveServerProject } from '@/services/projects'
import { useProjectsStore } from '@/store/projects-store'
import { useUIStore } from '@/store/ui-store'
import { formatServerTarget, type Project } from '@/types/projects'
import { ServerDialog } from './ServerDialog'
import { ServerUserSetupDialog } from './ServerUserSetupDialog'

/** The built-in local server: this computer (native) or the Jean server host (Web Access). */
function localServerLabel(): string {
  return isNativeApp() ? 'This computer' : 'Jean server'
}

/** No user means the ssh default, often root. */
function usesAdminUser(project: Project): boolean {
  if (project.server?.local) return false
  const user = project.server?.user
  return !user || user === 'root'
}

interface ServersListProps {
  /** Server projects only */
  servers: Project[]
}

const iconButtonClass =
  'flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function ServersList({ servers }: ServersListProps) {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const selectedProjectId = useProjectsStore(state => state.selectedProjectId)
  const removeServer = useRemoveServerProject()
  const [dialog, setDialog] = useState<{ project?: Project } | null>(null)
  const [removing, setRemoving] = useState<Project | null>(null)
  const [settingUp, setSettingUp] = useState<Project | null>(null)
  // Local first; it is built in (no SSH), so it has no row actions.
  const sortedServers = useMemo(
    () =>
      [...servers].sort(
        (a, b) => Number(!!b.server?.local) - Number(!!a.server?.local)
      ),
    [servers]
  )

  const handleOpen = useCallback(
    (project: Project) => {
      openServerProject(project.id, queryClient)
      if (isMobile) useUIStore.getState().setLeftSidebarVisible(false)
    },
    [isMobile, queryClient]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <span className="text-xs text-muted-foreground">
          SSH servers, managed by chat
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(iconButtonClass, 'size-8 rounded-md')}
              onClick={() => setDialog({})}
              aria-label="Add server"
            >
              <Plus className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Add server</TooltipContent>
        </Tooltip>
      </div>
      {servers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <Server className="size-5 text-muted-foreground/60" />
          <span className="text-sm text-muted-foreground">No servers yet</span>
          <Button size="sm" variant="outline" onClick={() => setDialog({})}>
            Add server
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-px px-1.5 pb-2">
          {sortedServers.map(project => {
            return (
              <li key={project.id} className="group relative">
                <button
                  type="button"
                  onClick={() => handleOpen(project)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 pr-20 text-left transition-colors hover:bg-muted/50',
                    selectedProjectId === project.id && 'bg-muted'
                  )}
                >
                  <Server className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{project.name}</span>
                    <span className="truncate text-[0.6875rem] text-muted-foreground">
                      {project.server?.local
                        ? `${localServerLabel()} · no SSH`
                        : project.server && formatServerTarget(project.server)}
                      {project.server?.jean_connection_id && ' · Jean'}
                    </span>
                    {usesAdminUser(project) && (
                      <span className="truncate text-[0.6875rem] text-amber-600 dark:text-amber-500">
                        Uses root · set up a restricted user
                      </span>
                    )}
                  </span>
                </button>
                {!project.server?.local && (
                  <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => setSettingUp(project)}
                      aria-label={`Set up restricted user on ${project.name}`}
                      title="Set up restricted user"
                    >
                      <Shield className="size-3" />
                    </button>
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => setDialog({ project })}
                      aria-label={`Edit ${project.name}`}
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => setRemoving(project)}
                      aria-label={`Remove ${project.name}`}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <ServerDialog
        open={dialog !== null}
        onOpenChange={open => !open && setDialog(null)}
        project={dialog?.project}
      />
      <ServerUserSetupDialog
        project={settingUp}
        onOpenChange={open => !open && setSettingUp(null)}
      />
      <AlertDialog
        open={removing !== null}
        onOpenChange={open => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the server entry and all its chat sessions. Nothing
              changes on the server itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => removing && removeServer.mutate(removing.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
