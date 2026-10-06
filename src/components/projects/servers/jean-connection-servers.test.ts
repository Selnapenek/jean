import { describe, expect, it } from 'vitest'
import type { RemoteConnection } from '@/lib/remote-connections'
import type { Project } from '@/types/projects'
import {
  jeanConnectionServerUpdates,
  ownServerProjects,
} from './jean-connection-servers'

const connection = (overrides: Partial<RemoteConnection> = {}) =>
  ({
    id: 'conn-1',
    name: 'Build box',
    url: 'http://10.0.0.7:3456',
    token: 't',
    ...overrides,
  }) as RemoteConnection

const mirror = (overrides: Partial<Project> = {}) =>
  ({
    id: 'p-1',
    name: 'Build box',
    path: '/data/servers/p-1',
    default_branch: 'server',
    added_at: 0,
    order: 0,
    server: { host: '10.0.0.7', jean_connection_id: 'conn-1' },
    ...overrides,
  }) as Project

describe('jeanConnectionServerUpdates', () => {
  it('creates a server from the Web Access URL host when SSH host is missing', () => {
    expect(jeanConnectionServerUpdates([connection()], [])).toEqual([
      {
        projectId: undefined,
        name: 'Build box',
        server: {
          host: '10.0.0.7',
          user: null,
          port: null,
          jean_connection_id: 'conn-1',
        },
      },
    ])
  })

  it('prefers explicit SSH settings', () => {
    const [update] = jeanConnectionServerUpdates(
      [
        connection({
          sshHost: 'ssh.example.com',
          sshUser: 'root',
          sshPort: 2222,
        }),
      ],
      []
    )
    expect(update?.server).toMatchObject({
      host: 'ssh.example.com',
      user: 'root',
      port: 2222,
    })
  })

  it('skips mirrors that are already up to date', () => {
    expect(jeanConnectionServerUpdates([connection()], [mirror()])).toEqual([])
  })

  it('updates an existing mirror when the connection changes', () => {
    const [update] = jeanConnectionServerUpdates(
      [connection({ name: 'Renamed' })],
      [mirror()]
    )
    expect(update).toMatchObject({ projectId: 'p-1', name: 'Renamed' })
  })

  it('keeps the user of an existing mirror', () => {
    const [update] = jeanConnectionServerUpdates(
      [connection({ name: 'Renamed', sshUser: 'root' })],
      [
        mirror({
          server: {
            host: '10.0.0.7',
            jean_connection_id: 'conn-1',
            user: 'jean',
          },
        }),
      ]
    )
    expect(update?.server.user).toBe('jean')
    expect(
      jeanConnectionServerUpdates(
        [connection({ sshUser: 'root' })],
        [
          mirror({
            server: {
              host: '10.0.0.7',
              jean_connection_id: 'conn-1',
              user: 'jean',
            },
          }),
        ]
      )
    ).toEqual([])
  })

  it('ignores mirrors owned by a remote Jean server', () => {
    const [update] = jeanConnectionServerUpdates(
      [connection()],
      [mirror({ serverId: 'conn-1' })]
    )
    expect(update?.projectId).toBeUndefined()
  })

  it('skips connections without a usable host', () => {
    expect(
      jeanConnectionServerUpdates([connection({ url: 'not a url' })], [])
    ).toEqual([])
  })
})

describe('ownServerProjects', () => {
  it('lists only servers stored by this Jean', () => {
    const local = mirror({ id: 'local', server: { host: '', local: true } })
    const ssh = mirror({ id: 'ssh' })
    const remoteLocal = mirror({
      id: 'r1',
      serverId: 'conn-1',
      server: { host: '', local: true },
    })
    const remoteSsh = mirror({ id: 'r2', serverId: 'conn-1' })
    const repo = mirror({ id: 'repo', server: null })
    expect(
      ownServerProjects([local, ssh, remoteLocal, remoteSsh, repo]).map(
        project => project.id
      )
    ).toEqual(['local', 'ssh'])
  })
})
