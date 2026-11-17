import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { loginAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-3xl font-black">Welcome back</h1>
      <AuthForm
        action={loginAction}
        submitLabel="Log in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        footer={{ text: "New to CodeQuest?", href: "/signup", link: "Create an account" }}
      />
    </>
  );
}
