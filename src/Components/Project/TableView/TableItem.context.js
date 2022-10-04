import { CombineOrSuspend, ReadyOrSuspend$ } from "@Helpers/Context.helper";
import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal, partitionByKey } from "@react-rxjs/utils";
import React, { useEffect, useState } from "react";
import { combineLatest, EMPTY, forkJoin, map, merge, of, pairwise, scan, startWith, switchMap, take, tap, withLatestFrom } from "rxjs";
import { ItemBadgeIcon } from "../../../Helpers/ProjectItem.helper";
import { AddBoardItemBadge, AssignedArtists$, BoardItemBadges$, RemoveBoardItemBadge, 
    SetBoardItemStatus, BoardItem$, GetPersonValues, BoardItemRescheduled$, BoardItemStatus$ } from "../Context/Project.Item.context";
import { BadgeOptions$, Board$, DepartmentOptions$, StatusOptions$ } from "../Context/Project.Objects.context";
import { ReviewDepartments$, ReviewItem$ } from "../Context/Project.Review.context";
import * as _ from 'underscore';
import { ShowUploadReviewDialog } from "./TableItemDlgs/TableItem.Upload.context";
import { AllUsers$, IsAdmin$ } from "../../../App.Users.context";
import { SendToastError, SendToastSuccess, SendToastWarning } from "../../../App.Toasts.context";
import { ShowEditTagsDialog } from "./TableItemDlgs/TableItem.EditTags.context";
import { ShowEditDescriptionDialog } from "./TableItemDlgs/TableItem.EditDescription.context";
import { ShowEditTimelineDialog } from "./TableItemDlgs/TableItem.EditTimeline.context";
import { AutoCloseReviewItemContext, ShowReviewContextMenu } from "./TableItemControls/TableItem.Review.Context";
import { BoardId$ } from "../Context/Project.Params.context";
import { MondayService } from "../../../Services/Monday.service";
import { IntegrationsService } from "../../../Services/Integrations.service";

// current tabs stored according to boarditem
const _activeTabMap = (BoardItemId, ActiveTab) => ({BoardItemId, ActiveTab});
const [ActiveTabMap$, SetActiveTab] = createSignal(_activeTabMap)
// map board items based on id
const [ActiveTabById, ActiveTabIds$] = partitionByKey(
    ActiveTabMap$,
    x => x.BoardItemId,
    $ => $.pipe(map(x => x.ActiveTab))
)

// retrieve active tab from id
const [useActiveTab, ActiveTab$] = bind((id) => ActiveTabById(id), SUSPENSE);

const [useReviewMenuOptions, ReviewMenuOptions$] = bind( 
    BoardItemId =>
    ReadyOrSuspend$(BoardItemId, ReviewDepartments$)
    , SUSPENSE
)

const BuildTabMenuItems = (menuOptions, activeTab, type, id) => {
    let options = menuOptions;
    if (options === SUSPENSE || activeTab === SUSPENSE)
        options = []

    else if (options === null || activeTab === null)
        options = [];

    const isSelected = (activeTab?.indexOf(type) || -1) > -1;
    return {
        label: isSelected ? activeTab : type,
        className: isSelected ? 'pm-item-tab-active' :'',
        items: options.concat([{separator: true}, 'All ' + type])
            .map(label => label.separator ?
                label : ({
                label,
                className: activeTab !== label ?
                    'pm-item-tab' : 'pm-item-tab-active',
                command: (evt) => SetActiveTab(id, label.indexOf('All') > -1 ? 
                    label : label + ' ' + type)
        }))
    }
}
/*
{label: 'Status', items: statusMenu},
            {label: 'Badges', items: removeBadgeMenu ? [addBadgeMenu, removeBadgeMenu] : [addBadgeMenu]},
            {separator: true},
            {label: 'Upload Review', command: (evt) => showUploadReviewDlg.setTrue()},
            //{label: 'Upload Reference', command: (evt) => {}},
            {separator: true},
            {label: 'Edit Task', command: (evt) => {showEditTaskDlg.setTrue()}}
*/
const [,StatusMenu$] = bind(
    BoardItemId => 
    StatusOptions$.pipe(
            map(options => 
                options.map(o => 
                    ({  label: o.label, 
                        style: {background: o.color}, 
                        command: (evt) => {
                            evt.originalEvent.stopPropagation();
                            SetBoardItemStatus(BoardItemId, o.label, o.color, o.index, o.column_id)
                        },
                        className: "pm-status pm-status-menu"  })),
        )
    )
)

const [, AddArtistMenu$] = bind(
    (BoardItemId, CurrentReviewId) => 
    combineLatest([AllUsers$, AssignedArtists$(BoardItemId, CurrentReviewId)]).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        map(([users, assigned]) => _.map(Object.values(users)
            .filter(u => assigned.map(a => a.toLowerCase()).indexOf(u.monday.name.toLowerCase()) < 0), 
                user => user.monday)),
        map(users => _.sortBy(users, u => u.name)),
        map(users => _.map(users, u => ({label: u.name, command: () => OnAddArtist(BoardItemId, CurrentReviewId, u)})))
    ), SUSPENSE
)

const OnRemoveArtist = (BoardItemId, CurrentReviewId, artist) => {
    combineLatest([
        BoardId$,
        BoardItem$(BoardItemId),
        ReviewItem$(CurrentReviewId),
        BoardItemRescheduled$(BoardItemId),
        AssignedArtists$(BoardItemId, CurrentReviewId),
        AllUsers$
    ]
).pipe(
    switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
    take(1)
).subscribe(([boardId, item, review, rescheduled, artists, allUsers]) => {
    const columnId = !CurrentReviewId ? item.Artist.id : review.Artist.id;
    const elementId = !CurrentReviewId ? item.id : review.id;
    const ids = artists.map(a => allUsers[a.toLowerCase()])
        .filter(a => !!a).map(a => a.monday)
        .filter(a => !!a).map(a => a.id)
        .filter(a => !!a && a.toString() !== artist.id.toString())

    of(boardId).pipe(
        switchMap(board => !CurrentReviewId ? of(board) : MondayService.Query_BoardId(elementId)),
        switchMap(board => MondayService.MutatePeople(board, elementId, columnId, ids))
    )
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
const OnAddArtist = (BoardItemId, CurrentReviewId, artist) => {
    combineLatest([
            BoardId$,
            BoardItem$(BoardItemId),
            ReviewItem$(CurrentReviewId),
            BoardItemRescheduled$(BoardItemId),
            AssignedArtists$(BoardItemId, CurrentReviewId),
            AllUsers$
        ]
    ).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        take(1)
    ).subscribe(([boardId, item, review, rescheduled, artists, allUsers]) => {
        const columnId = !CurrentReviewId ? item.Artist.id : review.Artist.id;
        const elementId = !CurrentReviewId ? item.id : review.id;
        const ids = artists.map(a => allUsers[a.toLowerCase()])
            .filter(a => !!a).map(a => a.monday)
            .filter(a => !!a)
            .map(a => a.id);

        ids.push(artist.id);

        of(boardId).pipe(
            switchMap(board => !CurrentReviewId ? of(board) : MondayService.Query_BoardId(elementId)),
            switchMap(board => MondayService.MutatePeople(board, elementId, columnId, ids))
        )
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

const [, RemoveArtistMenu$] = bind(
    (BoardItemId, CurrentReviewId) => 
    combineLatest([AllUsers$, AssignedArtists$(BoardItemId, CurrentReviewId)]).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        map(([users, assigned]) => assigned ? assigned.map(a => users[a.toLowerCase()].monday) : []),
        map(users => _.sortBy(users, u => u.name)),
        map(users => _.map(users, u => ({label: u.name, 
            command: () => OnRemoveArtist(BoardItemId, CurrentReviewId, u)})))
    ), SUSPENSE
)

const [, ArtistMenu$] = bind(
    (BoardItemId, CurrentReviewId) =>
    combineLatest([AddArtistMenu$(BoardItemId, CurrentReviewId), RemoveArtistMenu$(BoardItemId, CurrentReviewId)]).pipe(
        switchMap((params) => params.indexOf(SUSPENSE) > 0 ? EMPTY : of(params)),
        map(([add, remove]) => {
            const menu = [{label: 'Add Artist', items: add}, {label: 'Remove Artist', items: remove}];
            if (remove.length < 1)
                menu[1].items = [{label: 'No Assigned Artists', style: { fontStyle: 'italic'}}];
            return menu;
        })
    ), SUSPENSE
)

const [, AddBadgeMenu$] = bind(
    BoardItemId =>
    combineLatest([BoardItemBadges$(BoardItemId), BadgeOptions$])
    .pipe(
        map(([current, options]) => {
            if (current === SUSPENSE || options === SUSPENSE)
                return SUSPENSE;
            else if (current?.length >= 3)
                return MaxBadges;
            
            const currentTitles = _.pluck(Object.values(current), 'Title');
            return Object.values(options)
                .filter(o => currentTitles.indexOf(o.Title) < 0)
                .map(o => ({
                    label: o.Title,
                    icon: ItemBadgeIcon(o),
                    style: {background: o.Background},
                    className: "pm-status pm-status-menu",
                    command: (evt) => {
                        evt.originalEvent.stopPropagation();
                        AddBoardItemBadge(BoardItemId, o.Title.replace(/\s+/g, ''));
                    },
                })
            )
        })
    )
)

const NoBadges = [{label: 'No Badges to Remove...', style: {fontStyle: 'italic'}}]
const MaxBadges = [{label: 'Maximum 3 Badges... '}]

const [, RemoveBadgeMenu$] = bind(
    BoardItemId =>
    BoardItemBadges$(BoardItemId).pipe(
        map(badges => badges.length > 0 ? badges.map(o => 
            ({
                label: o.Title,
                icon: ItemBadgeIcon(o),
                style: {background: o.Background},
                className: "pm-status pm-status-menu",
                command: (evt) => {
                    evt.originalEvent.stopPropagation();
                    RemoveBoardItemBadge(BoardItemId, o.Title.replace(/\s+/g, ''));
                },
            })
        ) : NoBadges)
    )
)
const [, BadgeMenu$] = bind(
    BoardItemId =>
    combineLatest([AddBadgeMenu$(BoardItemId), RemoveBadgeMenu$(BoardItemId)]).pipe(
        map(([addMenu, removeMenu]) => [{
            label: 'Add Badge',
            items: addMenu
        },
        {
            label: 'Remove Badge',
            items: removeMenu
        }])
    )
)

const _showContextMap = (evt, id, ref) => ({evt, id, ref});
const [visibleContextMenusChanged$, ShowContextMenu] = createSignal(_showContextMap)

const [, TableItemDependencies$] = bind(
    (BoardItemId, CurrentReviewId) => 
    combineLatest([StatusMenu$(BoardItemId), BadgeMenu$(BoardItemId), ArtistMenu$(BoardItemId, CurrentReviewId), IsAdmin$]).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        map(([Status, Badges, Artists, isAdmin]) => ({Status, Badges, Artists, isAdmin}))
    ), SUSPENSE
)

const [useTableItemContextMenu, TableItemContextMenu] = bind(
    (BoardItemId, CurrentReviewId) =>
    TableItemDependencies$(BoardItemId, CurrentReviewId).pipe(
        map(({Status, Badges, Artists, isAdmin}) => {
            const menu = ([
                {   label: 'Status',
                    items: Status
                },
                { separator: true},
                    ...Badges,
                { separator: true},
                ...Artists,
                { separator: true},
                {label: 'Description', command: () => ShowEditDescriptionDialog(BoardItemId)},
                {label: 'Tags', command: () => ShowEditTagsDialog(BoardItemId, CurrentReviewId)},  
                { label: 'Timeline', command: () => ShowEditTimelineDialog(BoardItemId, CurrentReviewId)},
                { separator: true},
                { label: 'Upload New Review', 
                command: (evt) => ShowUploadReviewDialog(BoardItemId)
                }
            ]);

            if (isAdmin) {
                menu.push({ separator: true})
                menu.push({ label: 'Admin', items: [
                    {label: 'Force Status Update', command: () => ForceStatusUpdate(BoardItemId)}
                ]})
            }
            return menu;
        })
    ), SUSPENSE)

const ForceStatusUpdate = (id) => {
    BoardId$.pipe(
        withLatestFrom(StatusOptions$),
        withLatestFrom(BoardItemStatus$(id)),
        tap(t => console.log("ForcedUpdate", t)),
        take(1)
    ).subscribe(([[BoardId, Options], Status]) => {
        const thisStatus = _.find(Options, o => o.label === Status.text);

        if (!thisStatus)
            return;
        //const { text, index } = columnValue.label;
        //const { color } = columnValue.label.style;
        const status = {
            label: {
                text: Status.text,
                index: parseInt(thisStatus.index),
                style: {
                    color: Status.color
                }   
            },
            
        }

        IntegrationsService.BoardItem_ForceStatusUpdate(id, BoardId, status);
    })
}


const [AutoCloseBoardItemContext,] = bind(
    visibleContextMenusChanged$.pipe(
        startWith(null),
        pairwise(),
        tap(([prev, cur]) => {
            if (cur?.ref?.current) {
                ShowReviewContextMenu(null, null, null);
            }

            if (prev?.ref?.current)
                prev.ref.current.hide(prev.evt);

            if (cur?.ref?.current)
                cur.ref.current.show(cur.evt);
            return cur;
        })
    ), SUSPENSE
)

const [useReviewsMenu,] = bind(
    BoardItemId =>
    combineLatest(
        [ReadyOrSuspend$(BoardItemId, ReviewMenuOptions$),
        ReadyOrSuspend$(BoardItemId, ActiveTab$)]
    ).pipe(
        map(([options, activeTab]) =>
            BuildTabMenuItems(options, activeTab, 'Reviews', BoardItemId) 
        ),
    ), SUSPENSE
)

const [useReferenceMenu,] = bind(
    BoardItemId =>
    combineLatest(
        [DepartmentOptions$.pipe(
            map(options => options.filter(o => o.indexOf('All Departments') < 0)),
        ),
        ReadyOrSuspend$(BoardItemId, ActiveTab$)]
    ).pipe(
        map(([options, activeTab]) =>
            BuildTabMenuItems(options, activeTab, 'Reference', BoardItemId) 
        ),
    ), SUSPENSE
)

const [useSummaryMenu, ] = bind(
    BoardItemId =>
    ReadyOrSuspend$(BoardItemId, ActiveTab$).pipe(
        map(activeTab => ({
            label: 'Summary',
            className: activeTab === 'Summary' ? 'pm-item-tab-active' :'',
            command: (evt) => SetActiveTab(BoardItemId, 'Summary')
        })),
    ), SUSPENSE
)

const DefaultTableItemState = {
    ActiveTab: SUSPENSE,
    ActiveTabType: SUSPENSE,
}

export const TableItemContext = React.createContext(DefaultTableItemState); 

const TableItemProvider = ({BoardItemId, CurrentReviewId, children}) => {
    const [state, setState] = useState(DefaultTableItemState)
    const ActiveTab = useActiveTab(BoardItemId);
    const AutoClose = AutoCloseBoardItemContext();
    useEffect(() => {
        if (BoardItemId === SUSPENSE || CurrentReviewId === SUSPENSE)
            return;

        if (ActiveTab === SUSPENSE) {
            SetActiveTab(BoardItemId, CurrentReviewId ? 'All Reviews' : 'Summary');
            return;
        }

        setState({ ActiveTab })
    }, [ActiveTab, CurrentReviewId, BoardItemId]);

    return (
        <TableItemContext.Provider value={state}>
            {
                children
            }
        </TableItemContext.Provider>
    )
}

export {
    useActiveTab,
    SetActiveTab,
    ShowContextMenu,
    useReferenceMenu,
    useReviewsMenu,
    useSummaryMenu,
    useTableItemContextMenu,
    TableItemProvider
}
