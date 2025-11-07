"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import MobilePageHeader from '@/components/shared/mobile-page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ChevronRightIcon, BellIcon, HomeIcon, LifebuoyIcon, LockClosedIcon, ArrowRightStartOnRectangleIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserProfile } from '@/lib/services/user';
import { useProfile } from '@/lib/hooks/use-profile';

const ProfilePage = () => {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { profile, isLoading, isError, mutate } = useProfile();
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  // Edit form state
  const [editUsername, setEditUsername] = React.useState("");
  const [editPhoneNumber, setEditPhoneNumber] = React.useState("");

  // Handle errors (token refresh failures)
  React.useEffect(() => {
    if (isError) {
      if (isError instanceof Error && isError.message.includes("Token refresh failed")) {
        signOut({ redirect: false }).then(() => {
          router.push("/login");
          router.refresh();
        });
      } else {
        toast.error("Failed to load profile data");
      }
    }
  }, [isError, router]);

  const handleLogout = async () => {
    try {
      setLogoutOpen(false);
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
      console.error("Logout error:", error);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Open edit dialog and populate form
  const handleOpenEdit = () => {
    if (profile) {
      setEditUsername(profile.username);
      setEditPhoneNumber(profile.phone_number || "");
      setEditProfileOpen(true);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!session?.accessToken || !session?.refreshToken) {
      toast.error("Session expired. Please login again.");
      return;
    }

    if (!editUsername.trim()) {
      toast.error("Username is required");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedProfile = await updateUserProfile({
        username: editUsername.trim(),
        phone_number: editPhoneNumber.trim() || undefined,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        onTokenUpdate: async (newAccessToken, newRefreshToken) => {
          await updateSession({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });
        },
      });

      if (updatedProfile) {
        // Update SWR cache with new profile data
        mutate(updatedProfile, false);
        setEditProfileOpen(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      if (error instanceof Error && error.message.includes("Token refresh failed")) {
        await signOut({ redirect: false });
        router.push("/login");
        router.refresh();
        return;
      }
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div className="flex flex-1 flex-col md:gap-6 gap-0 md:p-6 p-0 h-full">
      {/* Mobile header */}
      <MobilePageHeader title="Profile" rightSlot={''}/>

      {/* Mobile content */}
      <div className="md:hidden px-4 py-3 space-y-4 overflow-y-auto">
        {/* Top profile */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-2 rounded-full bg-green-50">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar || undefined} alt={profile?.username || "User"} />
              <AvatarFallback>
                {profile ? getInitials(profile.username) : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center space-y-1">
            {isLoading ? (
              <>
                <div className="h-6 w-32 bg-muted animate-pulse rounded mx-auto mb-2" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded mx-auto" />
              </>
            ) : profile ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-semibold">{profile.username}</h2>
                  {profile.is_verified && (
                    <CheckBadgeIcon className="h-5 w-5 text-green-600" title="Verified" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {profile.phone_number && (
                  <p className="text-xs text-muted-foreground">{profile.phone_number}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                    {profile.user_type}
                  </span>
                  {profile.profile?.preferred_contact && (
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                      Prefers {profile.profile.preferred_contact}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">User</h2>
                <p className="text-sm text-muted-foreground">No profile data</p>
              </>
            )}
          </div>
          <Button 
            className="rounded-full px-5" 
            onClick={handleOpenEdit}
            disabled={!profile || isLoading}
          >
            Edit profile
          </Button>
        </div>

        {/* Preferences */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Preferences</p>
          <Card className="rounded-2xl divide-y p-2 overflow-hidden">
            <div className="w-full flex items-center gap-3 px-3 py-2">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <BellIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="font-medium">Push notifications</span>
                <Switch />
              </div>
            </div>
            <Button variant={"ghost"} className="w-full flex items-center gap-3 px-3 py-3 text-left">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="font-medium">PIN Code</span>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </Button>
          </Card>
        </div>

        {/* Logout */}
        <Card className="rounded-none p-2 overflow-hidden">
          <Button onClick={() => setLogoutOpen(true)} variant={"ghost"} className="w-full flex items-center gap-3 p-3 text-left justify-items-start text-red-600">
            <div className="h-9 w-9 rounded-xl text-red-600 flex items-center justify-center">
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
            </div>
            <span className="font-medium">Logout</span>
          </Button>
        </Card>
      </div>
      {/* Logout confirmation */}
      <Drawer open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerHeader>
            <DrawerTitle>Logout</DrawerTitle>
            <DrawerDescription>Are you sure you want to log out?</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full h-12">No</Button>
              </DrawerClose>
              <Button className="w-full h-12" onClick={handleLogout}>Yes</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isUpdating}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="Phone number"
                value={editPhoneNumber}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isUpdating}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditProfileOpen(false)}
              disabled={isUpdating}
              className="h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdating || !editUsername.trim()}
              className="h-12 bg-foreground text-background"
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage