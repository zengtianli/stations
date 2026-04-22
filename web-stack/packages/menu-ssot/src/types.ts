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
