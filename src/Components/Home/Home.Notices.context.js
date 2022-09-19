import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal, partitionByKey } from "@react-rxjs/utils";
import { concatMap, from, map, merge, of, scan, tap } from "rxjs";
import { FirebaseService } from "../../Services/Firebase.service";

export const [useNoticeboard, Notices$] = bind(
    FirebaseService.Notices$.pipe(
        scan((acc, notice) => {
            if (!notice)
                return acc;

            if (notice.change === 'removed')
                return [...acc.filter(n => n.id !== notice.id)]
            
            return [...acc.filter(n => n.id !== notice.id), notice];
        }, []),
    ), SUSPENSE
)

const [NoticeById, NoticeIds$] = partitionByKey(
    Notices$.pipe(
        concatMap(notices => from(notices))
    ),
    x => x.id
)

export const [ShowCreateNoticeDlgEvent$, ShowCreateNoticeDlg] = createSignal(show => show);
export const [useCreateNoticeDlg,] = bind(
    ShowCreateNoticeDlgEvent$, false
)

export const [CreateNoticeEvent$, CreateNotice] = createSignal((title, content) => ({title, content, action: 'Add'}));
export const [RemoveNoticeEvent$, RemoveNotice] = createSignal(id => ({id, action: 'Remove'}));
export const [EditNoticeEvent$, EditNotice] = createSignal(id => ({id, action: 'Edit'}));

export const [useNoticeEvents, NoticeEvents$] = bind(
    merge(CreateNoticeEvent$, RemoveNoticeEvent$, EditNoticeEvent$).pipe(

    ), SUSPENSE
)
export const [useNoticeContextMenu, NoticeContextMenu$] = bind(
    id => of(null).pipe(
        map(() => [
            {label: 'Add Notice',
                command: () => ShowCreateNoticeDlg(true)},
            { separator: true },
            {label: 'Edit Notice'},
            {label: 'Remove Notice'}
        ])
    ), SUSPENSE
)