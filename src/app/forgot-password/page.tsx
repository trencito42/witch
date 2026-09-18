import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";

export default function ForgotPage() {
  return (
    <>
      <SiteHeader />
      <AuthForm mode="forgot" />
    </>
  );
}
