import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, EMPTY, map, of, switchMap, take } from "rxjs";
import { SendToastError, SendToastSuccess } from "../../../../App.Toasts.context";
import { MondayService } from "../../../../Services/Monday.service";
import { BoardItem$ } from "../../Context/Project.Item.context";
import { ReviewItem$ } from "../../Context/Project.Review.context";

export const [showEditTimelineDlgEvent$, ShowEditTimelineDialog] = createSignal((BoardItemId, CurrentReviewId) => 
    ({BoardItemId, CurrentReviewId}));
const DefaultTimelineDetails = {BoardItemId: null, CurrentReviewId: null}
export const [useEditTimelineDlg, ] = bind(
    showEditTimelineDlgEvent$.pipe(
        map(result => result ? ({BoardItemId: result.BoardItemId, CurrentReviewId: result.CurrentReviewId}) : 
        DefaultTimelineDetails
        ),
    ), DefaultTimelineDetails
)

export const [showEditDeliveredDateDlgEvent$, ShowEditDeliveredDateDialog] = createSignal((BoardItemId, CurrentReviewId) => 
    ({BoardItemId, CurrentReviewId}));
const DefaultDeliveredDateDetails = {BoardItemId: null, CurrentReviewId: null}
export const [useDeliveredDateDlg, ] = bind(
    showEditDeliveredDateDlgEvent$.pipe(
        map(result => result ? ({BoardItemId: result.BoardItemId, CurrentReviewId: result.CurrentReviewId}) : 
        DefaultDeliveredDateDetails
        ),
    ), DefaultDeliveredDateDetails
)

export const onSetTimeline = (itemId, from, to, type)=> {
    combineLatest([
        MondayService.Query_BoardId(itemId),
        type === 'Review' ? ReviewItem$(itemId) : BoardItem$(itemId),
    ]
).pipe(
    switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
    switchMap(([boardId, item]) => MondayService.MutateTimeline(boardId, itemId, item.Timeline.id, from, to)),
    take(1)
    ).subscribe(res => {
        if (res?.change_column_value?.id) {
            SendToastSuccess("Timeline Successfully Updated");
            ShowEditTimelineDialog(null, null);
        }
        else {
            SendToastError("Unable to update Timeline");
        }
    })
}

