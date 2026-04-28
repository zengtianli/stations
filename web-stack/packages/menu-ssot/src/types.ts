export interface MegaItem {
  label: string
  url: string
  key?: string
  access?: "cf-access"
}
export interface MegaGroup {
  title: string
  items: MegaItem[]
}
export interface MegaCategory {
  key: string
  label: string
  /** Length is always 4 (may contain empty arrays as column placeholders). */
  columns: MegaGroup[][]
}
export interface SharedBrand {
  label: string
  url: string
  key: string
}
export interface SiteFooterLink {
  label: string
  href: string
  icon?: "github" | "linkedin" | "mail" | "file"
  external?: boolean
}
export interface SiteFooterBrand {
  /** Template string; `{year}` placeholder will be replaced at render time. */
  copyright: string
}
