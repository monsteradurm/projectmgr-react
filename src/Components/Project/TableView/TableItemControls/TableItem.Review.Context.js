import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, map, of, pairwise, startWith, switchMap, take, tap } from "rxjs";
import _ from "underscore";
import { SendToastError, SendToastSuccess, SendToastWarning } from "../../../../App.Toasts.context";
import { AllUsers$ } from "../../../../App.Users.context";
import { MondayService } from "../../../../Services/Monday.service";
import { DeleteMultipleSyncsketchItems, DeleteMultipleSyncsketchItems$, DeleteSyncsketchItem } from "../../Context/Project.Syncsketch.context";
import { ReviewItem$ } from "../../Context/Project.Review.context";
import { ShowEditTagsDialog } from "../TableItemDlgs/TableItem.EditTags.context";
import { ShowEditDeliveredDateDialog, ShowEditTimelineDialog } from "../TableItemDlgs/TableItem.EditTimeline.context";
import moment from 'moment';

//evt, CurrentReviewId, ReviewItems, Delivered, CurrentItemIndex, RowContextMenuRef
const _showContextMap = (evt, id, ref) => ({evt, id, ref});
export const [ReviewVisibleContextMenusChanged$, ShowReviewContextMenu] = createSignal(_showContextMap)

export const [useReviewContextMenu, ReviewContextMenu$] = bind(
    (BoardItemId, CurrentReviewId, ReviewItems, CurrentItemIndex, Delivered, Artists) =>
    AllUsers$.pipe(
        map((allUsers) => {
            let reviews = [{label: 'Delete Review', command: () => OnDeleteReview(CurrentReviewId, ReviewItems)}];
            if (ReviewItems.length > 1)
                reviews = [{label: 'Delete Item', command: () => DeleteSyncsketchItem(ReviewItems[CurrentItemIndex])
                             }, ...reviews]

            const removeArtistMenu = Artists !== SUSPENSE && Artists?.length > 0? 
                Artists.sort().map(a => ({label: a, command: () => 
                    OnRemoveArtist(CurrentReviewId, Artists, allUsers[a.toLowerCase()].monday.id, allUsers)})) 
                : [{label: 'No Artists Assigned'}];

            const filteredUsers = _.sortBy(Object.values(allUsers), a => a.monday.name)
                .filter(a => !Artists || Artists === SUSPENSE 
                    || Artists.indexOf(a.monday.name) < 0)
                .map(a => ({label: a.monday.name, command: () => OnAddArtist(CurrentReviewId, Artists, a.monday.id, allUsers)}));

            const today = moment().format('YYYY-MM-DD');

            const main = [
                { label: 'Add Item To Review', command: () => SendToastWarning("not Yet Implemented..") },
                { separator: true},
                ...reviews,
                { separator: true},
                { label: 'Tags', command: () => ShowEditTagsDialog(BoardItemId, CurrentReviewId, true)},
                { label: 'Timeline', command: () => ShowEditTimelineDialog(BoardItemId, CurrentReviewId)},
                { separator: true},
                { label: 'Add Artist', items: filteredUsers},
                { label: 'Remove Artist', items: removeArtistMenu},
                { separator: true},
                { label: 'Delivered Date', items: [
                    { label: 'Set as Today..', command: () => onSetDate(CurrentReviewId, today)},
                    { label: 'Set with Calendar', command: () => ShowEditDeliveredDateDialog(BoardItemId, CurrentReviewId)},
                    {separator: true},
                    { label: 'Clear', command: () => onSetDate(CurrentReviewId, null)}

                ]},
                { separator: true},
                { label: 'Copy To...', command: () => SendToastWarning("not Yet Implemented..")}
            ];
            
            return main;
    })
    ), SUSPENSE)

export const [AutoCloseReviewItemContext,] = bind(
    ReviewVisibleContextMenusChanged$.pipe(
        startWith(null),
        pairwise(),
        tap(([prev, cur]) => {
            if (prev?.ref?.current)
                prev.ref.current.hide(prev.evt);

            if (cur.ref?.current)
                cur.ref.current.show(cur.evt);
            return cur;
        })
    ), SUSPENSE
)

export const onSetDate = (reviewId, date) => {
    combineLatest([
        MondayService.Query_BoardId(reviewId),
        ReviewItem$(reviewId),
    ]
).pipe(
    switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
    tap(console.log),
    switchMap(([boardId, review]) => MondayService.MutateDate(boardId, reviewId, review['Delivered Date'].id, date)),
    take(1)
    ).subscribe(res => {
        if (res?.change_column_value?.id) {
            SendToastSuccess("Delivery Date Successfully Updated");
            ShowEditDeliveredDateDialog(null, null);
        }
        else {
            SendToastError("Unable to update Delivery Date");
        }
    })
}

const OnAddArtist = (reviewId, artists, artistId, allUsers) => {
    combineLatest([
            MondayService.Query_BoardId(reviewId),
            ReviewItem$(reviewId),
        ]
    ).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        take(1)
    ).subscribe(([boardId, review]) => {
        const columnId = review.Artist.id;
        const ids = artists.map(a => allUsers[a.toLowerCase()])
            .filter(a => !!a).map(a => a.monday)
            .filter(a => !!a)
            .map(a => a.id);

        ids.push(artistId);

        MondayService.MutatePeople(boardId, reviewId, columnId, ids)
       .pipe(
           take(1)
        ).subscribe(res => {
            if (res?.change_column_value?.id) {
                SendToastSuccess("Artists Successfully Updated");
            }
            else {
                SendToastError("Unable to update Artists");
            }
        })
    });
}

const OnDeleteReview = (reviewId, items) => {
    DeleteMultipleSyncsketchItems$(items).pipe(
        tap(t => console.log),
        switchMap(() => MondayService.ArchiveItem$(reviewId))
    ).subscribe((res) => {
        if (res?.archive_item?.id) {
            SendToastSuccess("Syncsketch Review and associated items were removed.")
        } else {
            SendToastError("There was an issue removing this Syncsketch Review")
        }
    })
}

const OnRemoveArtist = (reviewId, artists, artistId, allUsers) => {
    combineLatest([
            MondayService.Query_BoardId(reviewId),
            ReviewItem$(reviewId),
        ]
    ).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        take(1)
    ).subscribe(([boardId, review]) => {
        const columnId = review.Artist.id;
        const ids = artists.map(a => allUsers[a.toLowerCase()])
            .filter(a => !!a).map(a => a.monday)
            .filter(a => !!a)
            .map(a => a.id)
            .filter(id => !!id && id.toString() !== artistId.toString())

        MondayService.MutatePeople(boardId, reviewId, columnId, ids)
       .pipe(
           take(1)
        ).subscribe(res => {
            if (res?.change_column_value?.id) {
                SendToastSuccess("Artists Successfully Updated");
            }
            else {
                SendToastError("Unable to update Artists");
            }
        })
    });
}
