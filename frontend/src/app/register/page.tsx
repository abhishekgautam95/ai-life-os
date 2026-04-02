import { AuthForm } from "@/components/auth-form";
import { SectionShell } from "@/components/section-shell";

export default function RegisterPage() {
  return (
    <SectionShell
      eyebrow="Phase 1 Auth"
      title="Register"
      description="Create your account to start using the dashboard, tasks, notes, and goals."
      meta={["Fast onboarding", "Minimal setup", "Phase 1 MVP"]}
    >
      <AuthForm mode="register" />
    </SectionShell>
  );
}
