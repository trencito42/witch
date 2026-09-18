import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if ("password" in params || "email" in params) {
    redirect("/signup");
  }
  return (
    <>
      <SiteHeader current="signup" />
      <AuthForm mode="signup" />
    </>
  );
}
