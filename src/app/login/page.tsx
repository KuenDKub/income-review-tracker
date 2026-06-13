import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4 dark:bg-background">
      <LoginForm />
    </div>
  );
}
