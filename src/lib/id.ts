import { nanoid } from 'nanoid'

/** Short, collision-resistant id for entities. */
export function newId(prefix = ''): string {
  return prefix ? `${prefix}_${nanoid(10)}` : nanoid(10)
}