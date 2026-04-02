import { AuthForm } from "@/components/auth-form";
import { SectionShell } from "@/components/section-shell";

export default function LoginPage() {
  return (
    <SectionShell
      eyebrow="Phase 1 Auth"
      title="Login"
      description="Sign in to your workspace and continue managing your daily priorities."
      meta={["Simple auth", "JWT session", "Redirects after success"]}
    >
      <AuthForm mode="login" />
    </SectionShell>
  );
}
