import type { RemoteConnection } from '@/lib/remote-connections'
import type { Project, ProjectServer } from '@/types/projects'
import type { SaveServerProjectInput } from '@/services/projects'
import { LOCAL_SERVER_ID } from '@/types/server-resource'

/** SSH host of a Jean connection: explicit SSH host, else the Web Access URL host. */
function connectionSshHost(connection: RemoteConnection): string | null {
  if (connection.sshHost) return connection.sshHost
  try {
    return new URL(connection.url).hostname || null
  } catch {
    return null
  }
}

/**
 * Server projects to create or update so every Jean remote connection is also
 * a local server project (the SSH host that runs jean-server). Mirrors are
 * upserted only; removing a connection keeps its server and sessions.
 */
export function jeanConnectionServerUpdates(
  connections: RemoteConnection[],
  projects: Project[]
): SaveServerProjectInput[] {
  const mirrors = new Map(
    projects
      .filter(
        project =>
          (project.serverId ?? LOCAL_SERVER_ID) === LOCAL_SERVER_ID &&
          project.server?.jean_connection_id
      )
      .map(project => [project.server?.jean_connection_id, project])
  )

  return connections.flatMap(connection => {
    const host = connectionSshHost(connection)
    if (!host) return []
    const existing = mirrors.get(connection.id)
    const server: ProjectServer = {
      host,
      // Keep the user of an existing mirror: "Set up restricted user" changes it.
      user: existing
        ? (existing.server?.user ?? null)
        : (connection.sshUser ?? null),
      port: connection.sshPort ?? null,
      jean_connection_id: connection.id,
    }
    if (
      existing?.name === connection.name &&
      existing.server?.host === server.host &&
      (existing.server.port ?? null) === server.port
    ) {
      return []
    }
    return [
      {
        projectId: existing?.id,
        name: connection.name,
        server,
      },
    ]
  })
}

/**
 * Servers stored by the Jean you are on: its own machine (no SSH) plus the
 * servers it reaches over SSH, including copies of Jean remote connections.
 * The native app does not list a remote Jean's own servers: that Jean shows
 * them in its Web Access.
 */
export function ownServerProjects(projects: Project[]): Project[] {
  return projects.filter(
    project =>
      !!project.server &&
      (project.serverId ?? LOCAL_SERVER_ID) === LOCAL_SERVER_ID
  )
}
