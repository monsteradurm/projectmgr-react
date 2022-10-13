import { SUSPENSE } from "@react-rxjs/core";
import { useContext, useState } from "react";
import { of } from "rxjs";
import { LazyThumbnail } from "../../../General/LazyThumbnail";
import { BoardItemContext  } from "../../Context/Project.Item.context";
import { useReviewLink } from "../../Context/Project.Review.context";
import { LatestThumbnail$, useLatestThumbnail } from "../../Context/Project.Syncsketch.context";
import { ReadyOrSuspend$ } from "@Helpers/Context.helper";

export const TableItemThumbnail = () => {
    const { CurrentReviewId } = useContext(BoardItemContext);
    const reviewLink = useReviewLink(CurrentReviewId);
    const thumbnail$ = ReadyOrSuspend$(CurrentReviewId, LatestThumbnail$);
    const thumbnail = useLatestThumbnail(CurrentReviewId);
    
    return (
        <div className="pm-task-thumb-container">
            <LazyThumbnail width={100} height={60} thumbnail={thumbnail} 
            style={{borderRight: 'solid 1px black'}} onError={(evt) => console.log("Could not resolve Syncsketch Image", evt)}
            url={reviewLink}/>
        </div>
    )
}