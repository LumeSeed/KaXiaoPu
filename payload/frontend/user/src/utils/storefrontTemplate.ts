export type StorefrontTemplate = 'classic' | 'vault' | 'kaxiaopu'
export const STOREFRONT_TEMPLATES: StorefrontTemplate[] = ['classic', 'vault', 'kaxiaopu']
export const DEFAULT_TEMPLATE: StorefrontTemplate = 'classic'

// Each identifier selects its own template; never alias an existing template.
export const normalizeStorefrontTemplate = (value: unknown): StorefrontTemplate | null => {
  if (typeof value !== 'string') return null
  const name = value.trim()
  return name === 'classic' || name === 'vault' || name === 'kaxiaopu' ? name : null
}
