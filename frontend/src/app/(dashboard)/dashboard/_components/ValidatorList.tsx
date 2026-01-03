"use client";
import { useGetValidators } from "@/app/hooks/useCasper";
import { StackProps } from "@chakra-ui/react";
import { useEffect } from "react";

interface Props extends StackProps {}
export function ValidatorList(props: Props) {

    const casperAuctionInfoGet = useGetValidators();
    useEffect(() => {
        if(casperAuctionInfoGet.data) {
            console.log("Auction Info:", casperAuctionInfoGet.data.data);
        }
    }, [casperAuctionInfoGet.data]);
    return <div>Validator List Component</div>;
}
