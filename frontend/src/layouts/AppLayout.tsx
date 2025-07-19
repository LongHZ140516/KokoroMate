import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
// import { Main } from "./Main"

const SIDEBAR_STATE_KEY = 'sidebar-state'

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // 从localStorage读取sidebar状态，默认为true（展开）
    const savedSidebarState = localStorage.getItem(SIDEBAR_STATE_KEY)
    return savedSidebarState !== null ? JSON.parse(savedSidebarState) : false
  })

  // 监听sidebar状态变化并保存到localStorage
  const handleSidebarOpenChange = (open: boolean) => {
    setIsSidebarOpen(open)
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(open))
  }

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={handleSidebarOpenChange}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
      {/* <SidebarTrigger /> */}
        <main className="w-full p-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
} 