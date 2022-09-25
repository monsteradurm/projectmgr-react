import { bind } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { map } from "rxjs";

export const [showEditTagsDlgEvent$, ShowEditTagsDialog] = createSignal((BoardItemId, CurrentReviewId) => ({BoardItemId, CurrentReviewId}));
const DefaultTagsDetails = {BoardItemId: null, CurrentReviewId: null}
export const [useEditTagsDlg, ] = bind(
    showEditTagsDlgEvent$.pipe(
        map(result => result ? ({BoardItemId: result.BoardItemId, CurrentReviewId: result.CurrentReviewId}) : 
            DefaultTagsDetails
        ),
    ), DefaultTagsDetails
)
