"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import MobilePageHeader from '@/components/shared/mobile-page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ChevronRightIcon, BellIcon, HomeIcon, LifebuoyIcon, LockClosedIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import ordersData from '@/data.json';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';

const ProfilePage = () => {
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = React.useState(false);

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
              <AvatarImage src="https://i.pravatar.cc/160?img=12" alt="avatar" />
              <AvatarFallback>CT</AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold">{ordersData.agentInfo?.name || 'Agent'}</h2>
            <p className="text-sm text-muted-foreground">{ordersData.agentInfo?.email || 'agent@example.com'}</p>
          </div>
          <Button className="rounded-full px-5">Edit profile</Button>
        </div>

        {/* Inventories */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Inventories</p>
          <Card className="rounded-2xl divide-y p-2 overflow-hidden">
            <div className='pb-4'>
              <Button variant={"ghost"} className="w-full flex items-center gap-3 px-3 py-2 text-left" asChild>
                <a href="/offices">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium">My stores</span>
                    <div className="flex items-center gap-2">
                      <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </a>
              </Button>
            </div>
            <Button variant={"ghost"} className="w-full flex items-center gap-3 px-3 py-2 text-left">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <LifebuoyIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="font-medium">Support</span>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </Button>
          </Card>
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
    </div>
  )
}

export default ProfilePage