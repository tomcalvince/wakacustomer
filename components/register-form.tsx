"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { register } from "@/lib/services/auth"
import { formatPhoneNumber } from "@/lib/utils/phone"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

type CountryCode = "+256" | "+254"

const COUNTRIES: Array<{ code: CountryCode; flag: string; name: string }> = [
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
]

export function RegisterForm({
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [selectedCountryCode, setSelectedCountryCode] = React.useState<CountryCode>("+256")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate fields
      if (!firstName.trim()) {
        toast.error("First name is required")
        setIsLoading(false)
        return
      }

      if (!lastName.trim()) {
        toast.error("Last name is required")
        setIsLoading(false)
        return
      }

      if (!email.trim()) {
        toast.error("Email is required")
        setIsLoading(false)
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address")
        setIsLoading(false)
        return
      }

      if (!password.trim()) {
        toast.error("Password is required")
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters")
        setIsLoading(false)
        return
      }

      if (!phoneNumber.trim()) {
        toast.error("Phone number is required")
        setIsLoading(false)
        return
      }

      // Format phone number with selected country code
      const formattedPhone = formatPhoneNumber(phoneNumber, selectedCountryCode)

      // Register user
      await register({
        email: email.trim(),
        password: password.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: formattedPhone,
        user_type: "customer",
      })

      // Success - redirect to login with success message
      toast.success("Registration successful! Please login to continue.")
      router.push("/login")
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during registration."
      toast.error(errorMessage)
      setIsLoading(false)
    }
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCountryCode)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#F8F8F8]">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20 rounded-xl bg-[#7CB342] flex items-center justify-center">
            <Image
              src="/assets/applogo.svg"
              alt="Waka Logo"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black">
            Become a pickupwaka customer today
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-12 rounded-xl bg-white border placeholder:text-[#F08080]"
              required
              disabled={isLoading}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12 rounded-xl bg-white border placeholder:text-[#F08080]"
              required
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-white border pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-white border pl-10 pr-10 placeholder:text-[#F08080]"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 pointer-events-none">
                <span className="text-lg">{selectedCountry?.flag}</span>
              </div>
              <Select
                value={selectedCountryCode}
                onValueChange={(value) => setSelectedCountryCode(value as CountryCode)}
                disabled={isLoading}
              >
                <SelectTrigger className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 pointer-events-auto z-20">
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name} {country.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="tel"
                placeholder="phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12 rounded-xl bg-white border pl-14"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Sign Up Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#7CB342] hover:bg-[#6A9F38] text-white font-bold text-base"
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-sm text-[#F08080]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#7CB342] underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

