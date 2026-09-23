import { apiClient, type SystemMessage } from "@/lib/api-client";

const cache = new Map<string, SystemMessage>();

export async function resolveSystemMessage(id: string, params: Record<string, string | number> = {}) {
  let definition = cache.get(id);
  if (!definition) {
    const response = await apiClient.get<{ messages: SystemMessage[] }>(`/messages?keys=${encodeURIComponent(id)}`);
    definition = response.data.messages[0];
    if (!definition) throw new Error(`Unknown system message: ${id}`);
    cache.set(id, definition);
  }
  const format = (value: string) => value.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
  return { ...definition, title: format(definition.title), body: format(definition.body), params };
}
