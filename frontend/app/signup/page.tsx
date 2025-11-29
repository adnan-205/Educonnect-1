import { redirect } from "next/navigation"

export default function Page() {
  redirect("/sign-up")
}
// "use client"

// import { useEffect } from "react"
// import { useRouter } from "next/navigation"

// export default function SignupPage() {
//   const router = useRouter()

//   useEffect(() => {
//     router.replace("/sign-up")
//   }, [router])

//   return null
// }