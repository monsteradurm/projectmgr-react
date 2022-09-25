import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal, partitionByKey } from "@react-rxjs/utils";
import { concatMap, from, map, merge, of, scan, switchMap, take, tap } from "rxjs";
import _ from "underscore";
import { FirebaseService } from "../../Services/Firebase.service";

export const [useNoticeboard, Notices$] = bind(
    FirebaseService.Notices$.pipe(
        tap(console.log),
        scan((acc, notice) => {
            if (!notice)
                return acc;

            if (notice.change === 'removed')
                return [...acc.filter(n => n.id !== notice.id)]
            
            return [...acc.filter(n => n.id !== notice.id), notice];
        }, []),
        map(notices => _.sortBy(notices, n => n.updated_at).reverse())
    ), SUSPENSE
)

const [NoticeById, NoticeIds$] = partitionByKey(
    Notices$.pipe(
        concatMap(notices => from(notices))
    ),
    x => x.id
)
export const [useNotice, Notice$] = bind(
    id => NoticeById(id), SUSPENSE
)

export const [ShowEditNoticeDlgEvent$, ShowEditNoticeDlg] = createSignal(id => id);
export const [useEditNoticeDlg,] = bind(
    ShowEditNoticeDlgEvent$.pipe(
        switchMap(id => {
            if (id === 'New')
                return of({content: '', type: 'New', id: Date.now().toString()});
            if (!id)
                return of(null);
            return NoticeById(id).pipe(
                map(res => ({...res, type: 'Edit'}))
            )
        })
    ), null
)
export const [MouseOverNoticeChanged$, SetMouseOverNotice] = createSignal(id => id);
export const [, MouseOverNotice$] = bind(
    MouseOverNoticeChanged$, null
)

export const [CreateNoticeEvent$, CreateNotice] = createSignal((title, content) => ({title, content, action: 'Add'}));
export const [RemoveNoticeEvent$, RemoveNotice] = createSignal(id => ({id, action: 'Remove'}));
export const [EditNoticeEvent$, EditNotice] = createSignal(id => ({id, action: 'Edit'}));

export const [useNoticeEvents, NoticeEvents$] = bind(
    merge(CreateNoticeEvent$, RemoveNoticeEvent$, EditNoticeEvent$).pipe(

    ), SUSPENSE
)
const InitialMenu = [{label: 'Add Notice', command: () => ShowEditNoticeDlg('New')}]

export const StoreNotice = (notice) => {
    FirebaseService.StoreNotice$(notice).pipe(
        take(1)
    ).subscribe(() => { ShowEditNoticeDlg(null) })
}

export const DeleteNotice = (id) => {
    FirebaseService.DeleteNotice$(id).pipe(
        take(1)
    ).subscribe(() => {})
}

export const [useNoticeContextMenu, NoticeContextMenu$] = bind(
    id => 
    of(null).pipe(
        map(() => {
            let menu = [...InitialMenu];
            if (id) 
               menu = menu.concat([
                   { separator: true},
                    {label: 'Edit Notice',
                        command: () => ShowEditNoticeDlg(id)},
                    {label: 'Remove Notice',
                        command: () => DeleteNotice(id)}])
            
            return menu;
        }),
    ), InitialMenu
)