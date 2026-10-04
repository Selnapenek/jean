# Workflow and permission policies

The chat toolbar shows only the permission selector. Selecting a permission leaves any existing Plan mode. Full access is the default for new sessions. Existing preferences are not rewritten.

## Wire compatibility

Keep `selected_execution_mode` and each run's `execution_mode` compatible with previous history:

| Wire value   | Workflow | Permission policy                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------------- |
| `plan`       | Plan     | Backend planning/read-only policy                                                 |
| `supervised` | Build    | User approval for actions that need approval                                      |
| `build`      | Build    | Auto-accept edits on Claude, Codex, and OpenCode; legacy backend policy elsewhere |
| `auto`       | Build    | Backend-native automatic approval review                                          |
| `yolo`       | Build    | Full access                                                                       |

`selected_permission_mode` stores the Build permission choice while planning. It is session metadata, not global UI state. The existing session-state command persists it and broadcasts `permissionMode` changes after saving. Both the native shell and Web Access use the core dispatch handler.

Old session JSON without `selected_execution_mode` loads as Plan. Session creation captures the current default explicitly. This prevents the new default from escalating old sessions.

Shift+Tab toggles Plan/Build without cycling permissions. Plan approval uses the retained permission choice. The explicit legacy Yolo approval remains a Full access override.

## Capabilities

| Backend                                           | Permission choices                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| Claude                                            | Supervised, Auto-accept edits, Auto, Full access                   |
| Codex                                             | Supervised, Auto-accept edits, Auto, Full access                   |
| OpenCode                                          | Supervised, Auto-accept edits, Full access                         |
| Cursor, PI, Command Code, Grok, Kimi, Antigravity | Full access; retain existing Legacy Build sessions where supported |

Unsupported restricted policies must not become Full access. Backend selection falls back to Plan, and direct IPC/MCP sends reject unsupported policies.

Claude Supervised uses native `default` permissions and Jean's existing permission-denial/approval/re-send flow, not a live Agent SDK callback. Native Auto requires CLI/model/account support. Claude's provider policies, deny rules, and tools that require user input still apply.

Codex Supervised uses `untrusted` plus read-only sandboxing. Auto-accept edits keeps Jean's existing granular approvals and workspace-write sandbox. Sandboxed commands can run without approval. Auto uses `on-request` with `approvalsReviewer: auto_review`. Set and reset the reviewer on thread start, resume, and every turn so automatic review cannot leak into Supervised or Full access.

OpenCode installs explicit session permission rules before every turn, including resumed sessions. Failure to apply or confirm the rules in the returned session stops the turn. Supervised asks for edits and commands; Auto-accept edits allows edits but asks for commands. Plan resets permissive rules and denies edits and commands. Environment-file and external-directory access retain separate approval rules.

Do not add permission options for other backends until Jean can enforce them through the backend's real approval interface. A tool list, planning prompt, sandbox, or an ambiguously named auto-accept flag does not prove edit-only approval support.

## Current references

- https://code.claude.com/docs/en/permission-modes
- https://developers.openai.com/codex/app-server
- https://opencode.ai/docs/permissions/
- https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/server/routes/instance/httpapi/groups/session.ts

For Codex API changes, generate the installed app-server schema and check the exact request fields. Do not infer API support from UI labels.
