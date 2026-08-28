import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/domain/login-form";

export const metadata = {
  title: "Entrar — Project Risk AI",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-primary text-xl">Project Risk AI</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
