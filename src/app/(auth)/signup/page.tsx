import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { signupAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Create your profile" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-3xl font-black">Create your profile</h1>
      <AuthForm
        action={signupAction}
        submitLabel="Create account"
        withTimezone
        fields={[
          { name: "displayName", label: "Name", autoComplete: "name", placeholder: "Ada Lovelace" },
          { name: "username", label: "Username", autoComplete: "username", placeholder: "ada_codes" },
          { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
          { name: "password", label: "Password (8+ characters)", type: "password", autoComplete: "new-password" },
        ]}
        footer={{ text: "Already have an account?", href: "/login", link: "Log in" }}
      />
    </>
  );
}
