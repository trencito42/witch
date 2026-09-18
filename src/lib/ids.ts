import { createId } from "@paralleldrive/cuid2";

export function newId(prefix?: string): string {
  const id = createId();
  return prefix ? `${prefix}_${id}` : id;
}
