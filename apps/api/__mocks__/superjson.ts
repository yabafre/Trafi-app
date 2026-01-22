/**
 * Mock for superjson to handle ESM compatibility issues with Jest.
 * Provides proper serialize/deserialize functionality needed by tRPC.
 * Handles Date objects which are the most common special type.
 */

type Meta = {
  values?: Record<string, string[]>
}

function transformValue(value: unknown, path: string[] = [], meta: Meta): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (value instanceof Date) {
    // Record the Date transformation in meta
    if (!meta.values) meta.values = {}
    meta.values[path.join('.')] = ['Date']
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => transformValue(item, [...path, String(index)], meta))
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = transformValue(val, [...path, key], meta)
    }
    return result
  }

  return value
}

function untransformValue(value: unknown, path: string, meta: Meta): unknown {
  if (value === null || value === undefined) {
    return value
  }

  // Check if this path has a transformation
  if (meta?.values?.[path]?.includes('Date') && typeof value === 'string') {
    return new Date(value)
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      untransformValue(item, path ? `${path}.${index}` : String(index), meta)
    )
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const newPath = path ? `${path}.${key}` : key
      result[key] = untransformValue(val, newPath, meta)
    }
    return result
  }

  return value
}

const superjson = {
  serialize: (data: unknown) => {
    const meta: Meta = {}
    const json = transformValue(data, [], meta)
    return {
      json,
      meta: Object.keys(meta.values || {}).length > 0 ? meta : undefined,
    }
  },

  deserialize: <T = unknown>(payload: { json: unknown; meta?: Meta }): T => {
    return untransformValue(payload.json, '', payload.meta || {}) as T
  },

  parse: (text: string) => {
    const payload = JSON.parse(text)
    return superjson.deserialize(payload)
  },

  stringify: (data: unknown) => {
    return JSON.stringify(superjson.serialize(data))
  },

  registerClass: () => {},
  registerCustom: () => {},
  registerSymbol: () => {},
}

export default superjson
export const serialize = superjson.serialize
export const deserialize = superjson.deserialize
export const parse = superjson.parse
export const stringify = superjson.stringify
