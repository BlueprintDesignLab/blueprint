export const exampleYaml = `
# ============================================================
#  Google-Docs-Clone — C4-Flow DSL (Context layer only)
# ============================================================




















nodes:
  # ─── Actors ────────────────────────────────────────────────
  actor.user:
    label: User
    type: context
    role: actor

  actor.admin:
    label: Admin
    type: context
    role: actor

  # ─── Internal system ───────────────────────────────────────
  system.collab:
    label: Collab-Docs
    type: context
    role: internalSystem

  # ─── External supporting systems ───────────────────────────
  system.auth:
    label: Auth Provider
    type: context
    role: externalSystem

  system.storage:
    label: Object Storage
    type: context
    role: externalSystem

# ────────────────────────── EDGES ────────────────────────────
edges:
  # 1 ▸ User logs in to the app
  ctx_login:
    source: actor.user
    target: system.collab
    type: interaction
    kind: login
    sync: true
    trustBoundary: external
    confidentiality: confidential
    channel: web
    freq: interactive

  # 2 ▸ Admin performs management tasks
  ctx_admin_manage:
    source: actor.admin
    target: system.collab
    type: interaction
    kind: manage users
    sync: true
    trustBoundary: internal
    confidentiality: internal
    channel: web
    freq: interactive

  # 3 ▸ OAuth hand-off to external IdP
  ctx_oauth:
    source: system.collab
    target: system.auth
    type: interaction
    kind: oauth
    sync: true
    trustBoundary: external
    confidentiality: public
    channel: web
    freq: interactive

  # 4 ▸ Nightly export of documents to object storage
  ctx_export_docs:
    source: system.collab
    target: system.storage
    type: interaction
    kind: export
    sync: false
    trustBoundary: external
    confidentiality: internal
    channel: batch
    freq: periodic

`;

export const exampleJSON = `

`;
