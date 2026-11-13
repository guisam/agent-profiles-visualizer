/**
 * Response shapes of the Agent Profiles visualizer API (`src/visualize.ts` in
 * guisam/Agent-Profiles). Only the fields this app reads are typed; the server
 * may send more.
 */

export type SkillList = 'required' | 'available'

export interface Size {
  files: number
  bytes: number
  characters: number
}

// api/config

export interface ConfigResponse {
  /** Present only when the server runs with `--edit`. */
  editing: { revision: string; profiles: string[] } | null
  hosts: string[]
  models: string[]
  families: string[]
  roles: string[]
  /** Per role, the IDs of instruction skills a request can load on demand. */
  optionalSkills: Record<string, string[]>
  defaultRole: string | null
  initial: {
    host?: string
    model: string | null
    family: string | null
    role: string
    skills: string[]
  }
}

// api/resolve

export interface PackageIdentity {
  binding: string
  name: string
  version: string
  sha256: string
  revisionDigest?: string | null
  selectedBy: string
}

/** A skill as listed by a role (required or available). */
export interface SkillEntry {
  id: string
  /** `instruction` skills are injected; `host` skills are invoked by the host. */
  type: 'instruction' | 'host'
  delivery?: string
  name?: string
  description?: string
  path?: string
  bytes?: number
  characters?: number
  resources?: string[]
  package?: PackageIdentity
  backing?: { path: string }
  binding?: string
  supportedHosts?: string[]
  host?: string
  hostId?: string
  verification?: string
}

export type LoadedKind =
  | 'profile'
  | 'role'
  | 'required-skill'
  | 'requested-skill'
  | 'dependency'
  | 'workflow'

/** An instruction body that the resolution injects. */
export interface LoadedEntry extends Omit<SkillEntry, 'type'> {
  kind: LoadedKind
  type?: SkillEntry['type']
  content?: string
  bytes: number
  characters: number
  /** Dependency and workflow entries: the skill that pulled this one in. */
  owner?: string
}

export interface Withheld {
  id: string
  package: { name: string; version: string }
  reason: string
}

export interface Resolution {
  host: string | null
  model: string | null
  family: string | null
  matchedBy: string
  identity: { raw: string | null; canonical: string | null }
  profile: string
  role: string
  loaded: LoadedEntry[]
  required: SkillEntry[]
  available: SkillEntry[]
  requestedSkills?: string[]
  withheld?: Withheld[]
  diagnostics: {
    managed: {
      profile: Size
      role: Size
      requiredSkills: Size
      requestedSkills: Size
      total: Size
    }
    availableNotLoaded: Size
    repository: { path: string }
  }
}

// api/skills

export interface RoleUse {
  role: string
  list: SkillList
  /** Package usage: the configured skill ID that lists this version. */
  skill?: string
}

export interface PackageVersion {
  version: string
  source: string
  revisionDigest: string | null
  sha256: string | null
  description?: string | null
  skillName: string | null
  usage: { bindings: string[]; roles: RoleUse[] }
  evidence: number
  sameName: string[]
  /** Set when the version could not be verified. */
  error?: string
}

export interface LocalSkill {
  id: string
  path: string
  name: string
  skillName: string | null
  description: string | null
  host: string | null
  sameName: string[]
  usage: { roles: RoleUse[] }
}

export interface SkillsResponse {
  packages: { name: string; versions: PackageVersion[] }[]
  local: LocalSkill[]
  roles: Record<string, Record<SkillList, string[]>>
  /** Skill IDs bound to library packages. */
  packageSkills: string[]
  problems: string[]
}

// api/compare

export interface CompareFile {
  path: string
  bytes: number
  sha256: string
  binary: boolean
}

export interface CompareSide {
  kind: 'package' | 'local'
  name: string
  version: string | null
  sha256: string | null
  revisionDigest: string | null
  source: string | null
  path?: string
  metadata: { description: string | null }
  usage: { roles: RoleUse[] }
  evidence: {
    status: string
    rows: {
      assignment: { role: string; model: string; host: string }
      outcome: string
    }[]
  }
  files: CompareFile[]
}

export type FileStatus = 'same' | 'changed' | 'added' | 'removed'
export type Cell = [number, string] | null

export interface CompareResponse {
  left: CompareSide
  right: CompareSide
  identical: boolean
  files: { path: string; status: FileStatus; diff: string | null }[]
  aligned: {
    path: string
    status: FileStatus
    binary: boolean
    rows: { kind: FileStatus; left: Cell; right: Cell }[] | null
  }[]
}

// api/edit

export type ConfigEdit =
  | { action: 'add-skill'; role: string; skill: string; list: SkillList }
  | { action: 'remove-skill'; role: string; skill: string }
  | { action: 'add-model'; id: string; profile: string }
  | { action: 'add-family'; id: string; profile: string; prefixes?: string[] }
  | { action: 'add-role'; id: string; description?: string }
  | {
      action: 'bind-skill'
      role: string
      list: SkillList
      package: string
      version: string
      replace?: string
    }
  | {
      action: 'preview-replace' | 'apply-replace'
      binding: string
      target: string
      assignment: { role: string; model: string; host: string }
      expect?: string
    }

export interface EditResult {
  layer: 'project' | 'adapter'
  file: string
}

export interface ReplacePlan {
  status: 'preview' | 'already-pinned'
  previewDigest: string
  trustBlockers: string[]
  before: { package: string; version: string }
  after: { package: string; version: string }
  edits: { description: string; file: string }[]
  evidence: unknown[]
}
