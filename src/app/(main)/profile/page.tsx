import type { Metadata } from "next"
import { ProfilePage } from "@/components/profile/profile-page"

export const metadata: Metadata = { title: "Профиль — kCRM" }

/** 29 Профиль. */
export default function Profile() {
  return <ProfilePage />
}
