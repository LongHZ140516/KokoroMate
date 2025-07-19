import { Home, Mic, Search, Settings, MessagesSquare, AudioLines, Bot, BotMessageSquare, CircleAlert, ChevronsUpDown } from "lucide-react"
import { Link } from "react-router-dom"
 
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Menu items
const items = [
    {
        title: "Home",
        url: "/home",
        icon: Home
    },
    {
        title: "Chat",
        url: "/chat",
        icon: MessagesSquare
    },
    {
        title: "ASR",
        url: "/asr",
        icon: Mic
    },
    {
        title: "LLM",
        url: "/llm",
        icon: BotMessageSquare
    },
    {
        title: "TTS",
        url: "/tts",
        icon: AudioLines
    },
    {
        title: "Agent",
        url: "/agent",
        icon: Bot
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings
    },
    {
        title: "About",
        url: "/about",
        icon: CircleAlert
    }
]

export function AppSidebar() {
    return (
        <Sidebar 
        collapsible="icon"
        variant="floating"
        style={{
          "--sidebar-width-icon": "3rem"
        } as React.CSSProperties}
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/home" className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src="/assets/kana.jpeg" 
                      alt="Logo" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none min-w-0 transition-all duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0 group-data-[collapsible=icon]:w-0">
                    <span className="font-medium truncate">Kokoromate</span>
                    <span className="text-xs text-sidebar-foreground/70 truncate">AI Platform</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarSeparator className="m-0"/>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
            {/* Menu Items */}
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url}>
                        <item.icon size={20}/>
                        <span className="p-2">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator className="m-0"/>
        {/* Footer */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 ml-1">
                  <AvatarImage src="/assets/kana.jpeg" alt="Kana" />
                  <AvatarFallback className="rounded-lg">KN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight transition-all duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0">
                  <span className="truncate font-medium">Kana</span>
                  <span className="truncate text-xs">AI Assistant</span>
                </div>
                {/* <ChevronsUpDown className="ml-auto size-4 transition-all duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-0" /> */}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    )
  }