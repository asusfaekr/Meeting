"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { MoreHorizontal } from "lucide-react"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
  last_login: string | null
}

interface UserManagementProps {
  users: User[]
  currentUserId: string
}

export function UserManagement({ users: initialUsers, currentUserId }: UserManagementProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>(initialUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false)
  const [isDemoteDialogOpen, setIsDemoteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handlePromoteUser = async () => {
    if (!selectedUser) return

    setLoading(true)

    try {
      const { error } = await supabase.from("users").update({ role: "admin" }).eq("id", selectedUser.id)

      if (error) throw error

      toast({
        title: "User promoted",
        description: `${selectedUser.first_name} ${selectedUser.last_name} is now an admin`,
      })

      // Update local state
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, role: "admin" } : user)))

      setIsPromoteDialogOpen(false)
      setSelectedUser(null)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error promoting user",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoteUser = async () => {
    if (!selectedUser) return

    setLoading(true)

    try {
      const { error } = await supabase.from("users").update({ role: "user" }).eq("id", selectedUser.id)

      if (error) throw error

      toast({
        title: "User demoted",
        description: `${selectedUser.first_name} ${selectedUser.last_name} is now a regular user`,
      })

      // Update local state
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, role: "user" } : user)))

      setIsDemoteDialogOpen(false)
      setSelectedUser(null)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error demoting user",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                      {user.id === currentUserId && (
                        <Badge className="ml-2" variant="outline">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>{format(parseISO(user.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {user.last_login ? format(parseISO(user.last_login), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.id !== currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.role !== "admin" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsPromoteDialogOpen(true)
                                }}
                              >
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            {user.role === "admin" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsDemoteDialogOpen(true)
                                }}
                              >
                                Demote to User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Promote User Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote User to Admin</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Are you sure you want to promote {selectedUser.first_name} {selectedUser.last_name} to admin? Admins
                  can manage rooms, users, and have full access to the system.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handlePromoteUser} disabled={loading}>
              {loading ? "Promoting..." : "Promote to Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote User Dialog */}
      <Dialog open={isDemoteDialogOpen} onOpenChange={setIsDemoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demote Admin to User</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Are you sure you want to demote {selectedUser.first_name} {selectedUser.last_name} to regular user?
                  They will lose admin privileges and access to management features.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDemoteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDemoteUser} disabled={loading}>
              {loading ? "Demoting..." : "Demote to User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
