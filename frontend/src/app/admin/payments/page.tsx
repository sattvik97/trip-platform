import { redirect } from "next/navigation";

export default function AdminPaymentsRedirect() {
  redirect("/organizer/finance");
}
