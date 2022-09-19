import { SUSPENSE } from "@react-rxjs/core";
import { Stack } from "react-bootstrap";
import { useProjectsByStatus, useStatusItemGroups } from "./Home.context";
import { HomeStatusItem } from "./Home.StatusItem";

export const HomeStatus = ({Status}) => {
    const groups = useStatusItemGroups()
    
    if (groups === SUSPENSE)
        return <div>SUSPENDED</div>;

    return (
        <Stack direction="horizontal" className="flex-wrap" gap={3} 
            style={{width: '100%', justifyContent: 'center', height:'100%', paddingTop: 30}}>
        {
            groups.map(([title, items]) => items.map(i => <HomeStatusItem key={title + "_" + i.id} statusItem={i} />))
        }
        </Stack>
    )
}