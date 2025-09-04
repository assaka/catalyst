import AuthMiddleware from "@/components/shared/AuthMiddleware";

export default function Auth() {
  return <AuthMiddleware role="store_owner" />;
}