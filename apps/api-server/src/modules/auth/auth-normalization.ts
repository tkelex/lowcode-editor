export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim();
}

export function normalizeLoginAccount(account: string) {
  const normalizedAccount = account.trim();
  return normalizedAccount.includes('@') ? normalizeEmail(normalizedAccount) : normalizedAccount;
}

export function normalizeStringValue(value: unknown, normalizer: (value: string) => string) {
  return typeof value === 'string' ? normalizer(value) : value;
}
