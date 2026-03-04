/**
 * Capitalizes the first letter of a string
 */
export function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Gets the user's display name from user metadata
 * Returns nickname (capitalized) if available, otherwise email username (capitalized)
 */
export function getUserDisplayName(user: { user_metadata?: { nickname?: string }; email?: string | null } | null): string {
  if (!user) return 'Unknown user'
  
  if (user.user_metadata?.nickname) {
    return capitalizeFirst(user.user_metadata.nickname)
  }
  
  if (user.email) {
    const emailUsername = user.email.split('@')[0]
    return capitalizeFirst(emailUsername)
  }
  
  return 'Unknown user'
}
