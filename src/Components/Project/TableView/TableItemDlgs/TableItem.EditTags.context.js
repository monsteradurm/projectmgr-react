import { bind } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { map } from "rxjs";

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
