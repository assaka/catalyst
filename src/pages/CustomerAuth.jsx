import AuthMiddleware from "@/components/AuthMiddleware";

export default function CustomerAuth() {
  return <AuthMiddleware role="customer" />;
}