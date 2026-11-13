/**
 * Cabeçalhos de autenticação para as APIs do Supabase.
 * - Chave antiga "service_role" (JWT, começa com "eyJ"): vai em apikey e em Authorization: Bearer.
 * - Chave nova "secret" (começa com "sb_secret_"): vai só em apikey. Ela não é um JWT, então
 *   não pode ir no Authorization; o Supabase cuida da autorização a partir do apikey.
 */
export function supabaseAuthHeaders(key: string): Record<string, string> {
  return key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}
