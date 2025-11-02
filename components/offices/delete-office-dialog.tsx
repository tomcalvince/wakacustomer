"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteAgentOffice, type AgentOffice } from "@/lib/services/agent-offices"

interface DeleteOfficeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  office: AgentOffice
  onSuccess: () => void
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export function DeleteOfficeDialog({
  open,
  onOpenChange,
  office,
  onSuccess,
  accessToken,
  refreshToken,
  onTokenUpdate,
}: DeleteOfficeDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteAgentOffice({
        officeId: office.id,
        accessToken,
        refreshToken,
        onTokenUpdate,
      })

      toast.success("Office deleted successfully!")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete office. Please try again."
      toast.error(errorMessage)
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Delete Office</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{office.office_name}</strong>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 h-12 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 h-12 rounded-xl"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

