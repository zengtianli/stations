import MegaNavbar from "@/components/mega-navbar"

// ops-console 的子域是 dashboard.tianlizeng.cloud，
// 在 navbar.yaml.current_host_map 中对应 "dev" 分类。
export default function SharedNavbar() {
  return <MegaNavbar currentKey="dev" />
}
