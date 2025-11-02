import { Suspense } from "react"
import { RegisterForm } from "@/components/register-form"

function RegisterFormWrapper() {
  return <RegisterForm />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterFormWrapper />
    </Suspense>
  )
}

