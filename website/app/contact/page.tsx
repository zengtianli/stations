import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import { ContactInfo, ContactForm } from "@/components/contact-sections"

export const metadata = {
  title: "联系方式 | 曾田力",
  description: "与曾田力取得联系，探讨水利工程、数据分析、智能模型及软件系统研发等领域的合作机会。",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32">
        <PageHeader 
          title="联系方式" 
          description="与我取得联系，探讨水利工程、数据分析、智能模型及软件系统研发等领域的合作机会" 
        />
        <div className="space-y-16">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
      <Footer />
    </main>
  )
}
