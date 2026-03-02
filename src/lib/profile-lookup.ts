import { supabaseAdmin } from './supabase-admin'

// Spouse → primary member mapping for reservations
// Reservations made by a spouse should be listed under the primary member
const SPOUSE_TO_PRIMARY: Record<string, string> = {
  'shannon': 'Tyler',
}

export function getPrimaryMemberName(name: string): string | null {
  return SPOUSE_TO_PRIMARY[name.toLowerCase()] || null
}

export async function findProfileByName(name: string) {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, email, role')

  if (error || !profiles) return { profile: null, error: error?.message || 'No profiles found' }

  const lower = name.toLowerCase()

  // Exact match first
  const exact = profiles.find(p => p.display_name.toLowerCase() === lower)
  if (exact) return { profile: exact, error: null }

  // Partial match
  const partial = profiles.filter(p => p.display_name.toLowerCase().includes(lower))
  if (partial.length === 1) return { profile: partial[0], error: null }
  if (partial.length > 1) {
    return {
      profile: null,
      error: `Multiple matches for "${name}": ${partial.map(p => p.display_name).join(', ')}. Please be more specific.`
    }
  }

  return { profile: null, error: `No profile found matching "${name}"` }
}

export async function getFirstAdminProfile() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()
  return data
}
