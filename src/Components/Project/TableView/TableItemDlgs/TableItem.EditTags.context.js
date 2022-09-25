import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, EMPTY, map, of, switchMap, take } from "rxjs";
import { SendToastError, SendToastSuccess } from "../../../../App.Toasts.context";
import { MondayService } from "../../../../Services/Monday.service";
import { BoardItem$ } from "../../Context/Project.Item.context";
import { ReviewItem$ } from "../../Context/Project.Review.context";

export const [showEditTagsDlgEvent$, ShowEditTagsDialog] = createSignal(
    (BoardItemId, CurrentReviewId, reviewOnly) => ({BoardItemId, CurrentReviewId, reviewOnly}));
const DefaultTagsDetails = {BoardItemId: null, CurrentReviewId: null, reviewOnly: false}

export const [useEditTagsDlg, ] = bind(
    showEditTagsDlgEvent$.pipe(
        map(result => result ? ({BoardItemId: result.BoardItemId, 
                                CurrentReviewId: result.CurrentReviewId, 
                                reviewOnly: !!result.reviewOnly}) : 
            DefaultTagsDetails
        ),
    ), DefaultTagsDetails
)

export const OnTagsUpdate = (itemId, tags, type) => {
    combineLatest([
        MondayService.Query_BoardId(itemId),
        type === 'Review' ? ReviewItem$(itemId) : BoardItem$(itemId),
    ]
).pipe(
    switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
    switchMap(([boardId, item]) => MondayService.MutateTags(boardId, itemId, item.Tags.id, tags)),
    take(1)
    ).subscribe(res => {
        if (res?.change_column_value?.id) {
            SendToastSuccess(type + " Tags Successfully Updated");
            ShowEditTagsDialog(null, null);
        }
        else {
            SendToastError("Unable to update " + type + " Tags");
        }
    })
}
