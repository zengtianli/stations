import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import ServiceDashboard from "@/components/service-dashboard"
import LocalCatalog from "@/components/local-catalog"
import { SERVICE_GROUPS } from "@/lib/services"

export const metadata = {
  title: "服务总览 | 曾田力",
  description: "所有在线服务与本地工具一览——水利工具、开发平台、内容站点、基础设施、CLI 工具库。",
}

export default function ServicesPage() {
  const totalServices = SERVICE_GROUPS.reduce((sum, g) => sum + g.services.length, 0)

  return (
    <main className="min-h-screen flex flex-col bg-[#f5f5f7]">
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-6 md:px-8 w-full">
        <PageHeader
          title="服务总览"
          description={`${totalServices} 个在线服务，统一部署在 tianlizeng.cloud`}
        />
        <ServiceDashboard groups={SERVICE_GROUPS} />
        <LocalCatalog />
      </div>
      <Footer />
    </main>
  )
}
