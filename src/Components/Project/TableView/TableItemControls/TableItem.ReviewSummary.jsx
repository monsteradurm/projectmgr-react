import { SUSPENSE } from "@react-rxjs/core";
import { useContext, useEffect, useState } from "react"
import { Stack } from "react-bootstrap";
import { formatTimeline } from "../../../../Helpers/Timeline.helper";
import { BoardItemContext, useAssignedTimeline } from "../../Context/Project.Item.context"
import { useReviewName } from "../../Context/Project.Review.context";

export const TableItemReviewSummary = () => {
    const { BoardItemId, CurrentReviewId } = useContext(BoardItemContext);
    const ReviewName = useReviewName(CurrentReviewId);
    const Timeline = useAssignedTimeline(BoardItemId, CurrentReviewId);
    const [TimelineHTML, setTimelineHTML] = useState(null);

    useEffect(() => {
        const tl = formatTimeline(Timeline);

        if (tl === 'No Timeline')
            setTimelineHTML(
                <div className="pm-task-latest-timeline">{tl}</div>
            )
        else setTimelineHTML(
            <div className="pm-task-latest-timeline"> ({tl})</div>
        )
    }, [Timeline])

    if (CurrentReviewId === SUSPENSE || ReviewName === SUSPENSE) return null;

    return (
        <Stack direction="vertical" gap={0} style={{padding:'2px'}}>
            <div className="pm-task-latest-review" style={ReviewName ?
                {} : {color:'#999', fontStyle: 'italic'}}>
                {ReviewName ? ReviewName : 'No Reviews'}
            </div>   
            { TimelineHTML }
        </Stack>
    )
}