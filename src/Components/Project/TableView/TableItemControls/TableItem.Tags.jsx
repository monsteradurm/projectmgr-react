import { SUSPENSE } from "@react-rxjs/core";
import { useContext, useId } from "react"
import { Stack } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import _ from "underscore";
import { onTagClick } from "../../../Project/Overview.filters";
import { BoardItemContext, useBoardItemStatus, useBoardItemTags } from "../../Context/Project.Item.context"
import { useReviewTags } from "../../Context/Project.Review.context";

export const TableItemTags = () => {
    const { BoardItemId, CurrentReviewId } = useContext(BoardItemContext);
    const BoardItemTags = useBoardItemTags(BoardItemId);

    const key = useId();
    const Status = useBoardItemStatus(BoardItemId);
    const ReviewTags = useReviewTags(CurrentReviewId)

    const [searchParams, setSearchParams] = useSearchParams();
    const ItemTagsSuspended = BoardItemTags === SUSPENSE;
    const ReviewTagsSuspended = ReviewTags === SUSPENSE;
    return (
        <Stack direction="vertical" style={{justifyContent: 'center'}}>
            <Stack direction="horizontal" gap={2} className="pm-task-tags">
                {
                    !ItemTagsSuspended ? 
                    BoardItemTags.map((tag) => 
                    <div className="pm-tag" key={key + "_" + tag.id} 
                        style={{color: 'black'}}
                        onClick={(evt) => onTagClick(evt, tag.name, searchParams, setSearchParams)}>
                        {'#' + tag.name}
                    </div>) : null
                }
            </Stack>
            <Stack direction="horizontal" gap={2} 
            className="pm-task-tags" style={{color: Status?.color}}>
                {
                    !ReviewTagsSuspended ? 
                    ReviewTags.map((tag) => 
                    <div className="pm-tag" key={key + "_" + tag.id} 
                        style={{color: Status?.color}}
                        onClick={(evt) => onTagClick(evt, tag.name, searchParams, setSearchParams)}>
                        {'#' + tag.name}
                    </div>) : null
                }
            </Stack>
        </Stack>
    )
}