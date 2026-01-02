import { VStack } from "@chakra-ui/react";
import { Header } from "../dashboard/_components/Header";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stayer Protocol - Liquid Staking",
    description: "Stake CSPR to earn ySCSPR with Stayer Protocol.",
};

export default async function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <VStack minH="100vh" w="full" gap={0} bg="bg">
            <Header />
            {children}
        </VStack>
    );
}