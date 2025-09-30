/**
 * Masks an API key for secure display
 * Format: ####********#### (first 4, 8 asterisks, last 4)
 * @param key - The full API key to mask
 * @returns Masked key string
 */
export const maskApiKey = (key: string): string => {
  if (!key || key.length <= 8) {
    return key;
  }

  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const middle = "*".repeat(8);

  return `${start}${middle}${end}`;
};
