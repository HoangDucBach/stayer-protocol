import { ProtectedContent } from "@/app/_components/ProtectedContent";

export default function Page() {
  return (
    <ProtectedContent>
      <div>
        <h1>Dashboard</h1>
        <p>Welcome to your dashboard!</p>
      </div>
    </ProtectedContent>
  );
}