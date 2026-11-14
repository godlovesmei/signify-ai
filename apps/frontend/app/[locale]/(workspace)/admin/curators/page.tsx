import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
export default async function CuratorAccessPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect({ href: "/curator", locale });
}
