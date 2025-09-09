"use client"

import * as React from "react"
import { ArchiveX, Command, File, Inbox, Send, Trash2, MessageCircle } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Chat, User } from "@/lib/models"

// John Doe's user data
const johnDoeUser = {
  _id: "68b9323486612019c0b8021e",
  name: "John Doe",
  email: "john@example.com",
  pic: "https://example.com/avatar1.jpg",
  isAdmin: false,
  createdAt: "2025-09-04T06:31:16.343+00:00",
  updatedAt: "2025-09-04T06:31:16.343+00:00"
}

const navMain = [
  {
    title: "All Chats",
    url: "#",
    icon: MessageCircle,
    isActive: true,
  },
  {
    title: "Group Chats",
    url: "#",
    icon: Inbox,
    isActive: false,
  },
  {
    title: "Direct Messages",
    url: "#",
    icon: Send,
    isActive: false,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onChatSelect?: (chat: Chat) => void;
  currentUser?: User | null;
}

export function AppSidebar({ onChatSelect, currentUser, ...props }: AppSidebarProps) {
  const [activeItem, setActiveItem] = React.useState(navMain[0])
  const [chats, setChats] = React.useState<Chat[]>([])
  const [loading, setLoading] = React.useState(true)
  const { setOpen } = useSidebar()

  // Fetch current user's chats with unread counts
  React.useEffect(() => {
    if (!currentUser) return;
    
    const fetchChats = async () => {
      try {
        const response = await fetch(`/api/chats/unread?userId=${currentUser._id}`)
        const data = await response.json()
        if (data.success) {
          setChats(data.chats)
        }
      } catch (error) {
        console.error('Error fetching chats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [currentUser])

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item)
                        setOpen(true)
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={{
            name: currentUser?.name || "Select a user",
            email: currentUser?.email || "",
            avatar: currentUser?.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
          }} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
            <Label className="flex items-center gap-2 text-sm">
              <span>Unreads</span>
              <Switch className="shadow-none" />
            </Label>
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading chats...
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No chats found. Start a conversation!
                </div>
              ) : (
                chats.map((chat) => {
                  const unreadCount = chat.unreadCount?.[currentUser?._id?.toString() || ''] || 0;
                  return (
                    <button
                      key={chat._id?.toString()}
                      onClick={() => onChatSelect?.(chat)}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 w-full text-left relative"
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className="font-medium">{chat.chatName}</span>
                        <div className="ml-auto flex items-center gap-2">
                          {unreadCount > 0 && (
                            <div className="bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                          )}
                          <span className="text-xs">
                            {chat.isGroupChat ? "Group" : "Direct"}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {chat.users.length} participant{chat.users.length !== 1 ? 's' : ''}
                      </span>
                      {chat.latestMessage && (
                        <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
                          Latest message available
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
