import { redirect } from "next/navigation";

export default async function LegacyTripDetailRedirect({
  params,
}: {
  params: Promise<{ organizerSlug: string; tripSlug: string }>;
}) {
  const { tripSlug } = await params;
  redirect(`/trip/${tripSlug}`);
}
