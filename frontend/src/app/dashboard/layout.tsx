import { Header } from "./_components/Header";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div>
      <Header />
      {children}
    </div>
  );
}
