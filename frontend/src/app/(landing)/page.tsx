import Image from "next/image";
import dynamic from "next/dynamic";

const WalletConnect = dynamic(
  () =>
    import("../_components/WalletConnect").then((mod) => ({
      default: mod.WalletConnect,
    })),
  { ssr: false }
);

export default function Home() {
  return (
    <div>
      
    </div>
  );
}
