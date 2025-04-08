"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Trash2, Users, Image } from "lucide-react"

interface Room {
  id: string
  name: string
  capacity: number
  location: string
  features: string[] | null
  is_active: boolean
  photo_url: string | null
}

interface RoomManagementProps {
  rooms: Room[]
}

export function RoomManagement({ rooms: initialRooms }: RoomManagementProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState("")
  const [location, setLocation] = useState("")
  const [features, setFeatures] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  const resetForm = () => {
    setName("")
    setCapacity("")
    setLocation("")
    setFeatures("")
    setPhotoUrl("")
    setIsActive(true)
    setSelectedRoom(null)
  }

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const featuresList = features
        .split(",")
        .map((feature) => feature.trim())
        .filter((feature) => feature)

      const { data, error } = await supabase
        .from("meeting_rooms")
        .insert({
          name,
          capacity: Number.parseInt(capacity),
          location,
          features: featuresList.length > 0 ? featuresList : null,
          is_active: isActive,
          photo_url: photoUrl || null,
        })
        .select()

      if (error) throw error

      toast({
        title: "Room added",
        description: "The meeting room has been added successfully",
      })

      setRooms([...rooms, data[0] as Room])
      setIsAddDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error adding room",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRoom) return

    setLoading(true)

    try {
      const featuresList = features
        .split(",")
        .map((feature) => feature.trim())
        .filter((feature) => feature)

      const { error } = await supabase
        .from("meeting_rooms")
        .update({
          name,
          capacity: Number.parseInt(capacity),
          location,
          features: featuresList.length > 0 ? featuresList : null,
          is_active: isActive,
          photo_url: photoUrl || null,
        })
        .eq("id", selectedRoom.id)

      if (error) throw error

      toast({
        title: "Room updated",
        description: "The meeting room has been updated successfully",
      })

      // Update local state
      setRooms(
        rooms.map((room) =>
          room.id === selectedRoom.id
            ? {
                ...room,
                name,
                capacity: Number.parseInt(capacity),
                location,
                features: featuresList.length > 0 ? featuresList : null,
                is_active: isActive,
                photo_url: photoUrl || null,
              }
            : room,
        ),
      )

      setIsEditDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating room",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return

    setLoading(true)

    try {
      const { error } = await supabase.from("meeting_rooms").delete().eq("id", selectedRoom.id)

      if (error) throw error

      toast({
        title: "Room deleted",
        description: "The meeting room has been deleted successfully",
      })

      // Update local state
      setRooms(rooms.filter((room) => room.id !== selectedRoom.id))
      setIsDeleteDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error deleting room",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (room: Room) => {
    setSelectedRoom(room)
    setName(room.name)
    setCapacity(room.capacity.toString())
    setLocation(room.location)
    setFeatures(room.features ? room.features.join(", ") : "")
    setPhotoUrl(room.photo_url || "")
    setIsActive(room.is_active)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-500">Manage meeting rooms, their capacities, and features</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meeting Room</DialogTitle>
              <DialogDescription>Add a new meeting room to the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRoom}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Features</Label>
                  <Input
                    id="features"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="Projector, Whiteboard, Video Conference"
                  />
                  <p className="text-xs text-gray-500">Separate features with commas</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="/images/rooms/room-1.jpg"
                  />
                  <p className="text-xs text-gray-500">Enter the path to the room photo</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="is-active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Room"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{room.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {room.capacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {room.features?.map((feature, index) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                        {!room.features?.length && <span className="text-gray-500">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {room.photo_url ? (
                        <div className="flex items-center">
                          <Image className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-xs text-green-500">Added</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={room.is_active ? "success" : "secondary"}>
                        {room.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(room)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(room)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    No meeting rooms found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Room Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Meeting Room</DialogTitle>
            <DialogDescription>Update the meeting room details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRoom}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Room Name</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-features">Features</Label>
                <Input
                  id="edit-features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Projector, Whiteboard, Video Conference"
                />
                <p className="text-xs text-gray-500">Separate features with commas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-photoUrl">Photo URL</Label>
                <Input
                  id="edit-photoUrl"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="/images/rooms/room-1.jpg"
                />
                <p className="text-xs text-gray-500">Enter the path to the room photo</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="edit-is-active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="edit-is-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Room Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this meeting room? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoom} disabled={loading}>
              {loading ? "Deleting..." : "Delete Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
