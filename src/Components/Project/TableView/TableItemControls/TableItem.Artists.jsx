import { SUSPENSE } from "@react-rxjs/core";
import { AvatarGroup } from "primereact/avatargroup";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useContext, useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserAvatar } from "../../../General/UserAvatar";
import { BoardItemContext, useAssignedArtists, useBoardItemStatus } from "../../Context/Project.Item.context";
import { useCurrentReviewName, useReviewName } from "../../Context/Project.Review.context";
import { onArtistClick } from "../../Overview.filters";

const SuspendedArtists= () => {
    const key = useId();

    return [0, 1].map(b =>
    <Button className="pm-badge suspended p-button-rounded" key={`${key}_${b}`} 
        style={{background: 'lightgray'}}>
    </Button>)
}

export const TableItemArtists = () => {
    const {CurrentReviewId, BoardItemId} = useContext(BoardItemContext);
    const artists = useAssignedArtists(BoardItemId, CurrentReviewId);
    const status = useBoardItemStatus(BoardItemId);

    if (artists === SUSPENSE)
        return <SuspendedArtists />;
        
    const color = status === SUSPENSE ? null : status.color;
    
    if (!artists)
        return <></>
    return (
        <>
            <Tooltip target=".pm-avatar" position="top" className="pm-tooltip" mouseTrack={false}
                    mouseTrackTop={10}/>
            <AvatarGroup>
            {
                artists.map(a => 
                <UserAvatar key={BoardItemId + "_" + a} uid={a} color={color}
                    affectFilters={true}/>)
            }
            </AvatarGroup>
        </>             
    )
}