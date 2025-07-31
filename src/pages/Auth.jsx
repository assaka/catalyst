import AuthMiddleware from "@/components/AuthMiddleware";

export default function Auth() {
  return <AuthMiddleware role="store_owner" skipRedirectIfAuthenticated={true} />;
}