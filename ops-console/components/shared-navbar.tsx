import MegaNavbar from "@/components/mega-navbar"
import { SearchTrigger } from "@/components/search-trigger"

// ops-console 的子域是 dashboard.tianlizeng.cloud，对应 "dev-tools" 分类。
export default function SharedNavbar() {
  return <MegaNavbar currentKey="dev-tools" rightSlot={<SearchTrigger />} />
}
