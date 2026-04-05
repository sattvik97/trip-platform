import { redirect } from "next/navigation";

export default function OrganizerRootRedirect() {
  redirect("/organizer/overview");
}
