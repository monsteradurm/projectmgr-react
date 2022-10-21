import { SUSPENSE } from "@react-rxjs/core";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MondayUser$ } from "../../App.Users.context"
import { SetTitles } from "../../Application.context";
import { SetAllocationNesting, useAllocationsByProject, useMyAllocations } from "./Allocations.context";

export const AllocationsComponent = ({}) => {
    const allocations = useAllocationsByProject();
    const [searchParams, setSearchParams] = useSearchParams();

    console.log("ALLOCATIONS BY PROJECT: ", allocations);

    useEffect(() => {
        let titles = ['Home', 'Allocations'];

        let nesting = [searchParams.get('Nesting')];
        if (nesting[0]) {
            if (nesting[0].length)
                nesting = nesting[0].split(',');

            titles = [...titles, ...nesting];
            
        }

        SetAllocationNesting(nesting.filter(n => !!n));
        SetTitles(titles);

    }, [])

    return <></>
}