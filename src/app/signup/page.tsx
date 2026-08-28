import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/domain/signup-form";

export const metadata = {
  title: "Criar conta — Project Risk AI",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-primary text-xl">Project Risk AI</CardTitle>
          <CardDescription>
            Crie sua conta para começar a usar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
