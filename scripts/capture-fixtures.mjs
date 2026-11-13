// Record fixture responses from a running `agent-profiles visualize` server.
//
//   node scripts/capture-fixtures.mjs http://127.0.0.1:<port>/<token>/ src/fixtures/default
//
// Records api/config and api/skills; api/resolve for every configured host,
// model and family (and none) × role × no, each single or all optional
// skills; and api/compare for every ordered
// pair of skills that share a SKILL.md name (or package), plus every pair of
// project-local skills. Recording every possible pair would be too large.
import { writeFileSync } from 'node:fs'

const [base, dir] = process.argv.slice(2)
const get = async (path) => {
  const r = await fetch(base + path)
  return { status: r.status, body: await r.json() }
}
const config = (await get('api/config')).body
writeFileSync(`${dir}/config.json`, JSON.stringify(config))
const skills = (await get('api/skills')).body
writeFileSync(`${dir}/skills.json`, JSON.stringify(skills))
const resolve = {}
for (const host of ['', ...config.hosts])
  for (const model of ['', ...config.models])
    for (const family of ['', ...config.families])
      for (const role of config.roles) {
        const optional = [...(config.optionalSkills[role] ?? [])].sort()
        const sets = [
          [],
          ...optional.map((s) => [s]),
          ...(optional.length > 1 ? [optional] : []),
        ]
        for (const skills of sets) {
          const q = new URLSearchParams()
          if (host) q.set('host', host)
          if (model) q.set('model', model)
          if (family) q.set('family', family)
          q.set('role', role)
          for (const s of skills) q.append('skill', s)
          resolve[q.toString()] = (await get(`api/resolve?${q}`)).body
        }
      }
writeFileSync(`${dir}/resolve.json`, JSON.stringify(resolve))
const compare = {}
// Group selectors the way the Skills table groups rows.
const groups = new Map()
const add = (key, selector) =>
  groups.set(key, [...(groups.get(key) ?? []), selector])
for (const item of skills.packages)
  for (const version of item.versions)
    if (!version.error)
      add(
        version.skillName ?? item.name,
        `package:${item.name}@${version.version}`,
      )
// A leading space keeps this key apart from any SKILL.md name.
groups.set(
  ' local',
  skills.local.map((skill) => `local:${skill.path}`),
)
for (const selectors of groups.values())
  for (const left of selectors)
    for (const right of selectors) {
      if (left === right) continue
      const q = new URLSearchParams({ left, right })
      compare[q.toString()] = (await get(`api/compare?${q}`)).body
    }
writeFileSync(`${dir}/compare.json`, JSON.stringify(compare))
console.log(
  Object.keys(resolve).length,
  'resolves;',
  Object.keys(compare).length,
  'compares',
)
