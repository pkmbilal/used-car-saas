// Shared by the avatar server actions and the uploader (client-safe).
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function avatarKeyPattern(userId: string): RegExp {
  return new RegExp(`^avatars/${userId}/[0-9a-f-]{36}\.(jpg|png|webp)$`);
}
