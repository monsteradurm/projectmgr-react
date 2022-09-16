import { useContext, useEffect, useState } from "react"
import { BoardItemContext } from "../../Context/Project.Item.context"
import { ReferenceViewer } from "@Components/Box/ReferenceViewer";
import { SUSPENSE } from "@react-rxjs/core";
import { TableItemContext } from "../TableItem.context";
import { ProjectContext } from "../../Context/Project.context";
import { ErrorLoading } from "@Components/General/ErrorLoading";
import { Loading } from "@Components/General/Loading";
import { BoxFile } from "@Components/Box/BoxFile";

export const TableItemReference = ({visible}) => {
    const { ReferenceFolder: ProjectReference } = useContext(ProjectContext);
    const { Status, Element, ReferenceFolder} = useContext(BoardItemContext);
    const { ActiveTab } = useContext(TableItemContext);

    if (!visible) return <></>

    if (ProjectReference === SUSPENSE)
        return <Loading text="Fetching Project Box Folder..." />

    else if (!ProjectReference)
        return <ErrorLoading 
        text="Could not find a Box folder for either or all of this Project, Board and Group." />

    else if (ReferenceFolder === SUSPENSE)
        return <Loading text={`Fetching ${Element} Box Folder...`} />
    
    else if(!ReferenceFolder)
        return <ErrorLoading text={`Could not find a Box folder for ${Element}`} />

    else if (ReferenceFolder.entries.length < 1)
        return <div>No Items</div>;

    let entries = ReferenceFolder.entries;
    
    if (ActiveTab.indexOf('All') !== 0) {
        const tag = ActiveTab.replace(' Reference', '');
        entries = entries.filter(e => e.tags.indexOf(tag) >= 0)
    }

    return entries.map((e) => <BoxFile key={e.id} file={e} primary={Status.color} />);
}