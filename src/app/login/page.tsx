import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if ("password" in params) {
    redirect("/login");
  }
  return (
    <>
      <SiteHeader current="login" />
      <AuthForm mode="login" />
    </>
  );
}
