import { bind } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { map, take } from "rxjs";
import { SendToastError, SendToastSuccess } from "../../../../App.Toasts.context";
import { MondayService } from "../../../../Services/Monday.service";

export const [showEditDescriptionDlgEvent$, ShowEditDescriptionDialog] = createSignal((BoardItemId) => ({BoardItemId}));
const DefaultDescriptionDetails = {BoardItemId: null}
export const [useEditDescriptionDlg, ] = bind(
    showEditDescriptionDlgEvent$.pipe(
        map(result => result ? ({BoardItemId: result.BoardItemId}) : 
            DefaultDescriptionDetails
        ),
    ), DefaultDescriptionDetails
)

export const SubmitDescription = (id, content) => {
    console.log(content);
    MondayService.StoreUpdate$(id, content).pipe(
        take(1)
    ).subscribe((res) => {
        if (res?.create_update) {
            SendToastSuccess('Description Updated');
            ShowEditDescriptionDialog(null);
        } else {
            SendToastError('There was an error updating the description')
        }
    })
}