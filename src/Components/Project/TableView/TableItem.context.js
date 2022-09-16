import { CombineOrSuspend, ReadyOrSuspend$ } from "@Helpers/Context.helper";
import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal, partitionByKey } from "@react-rxjs/utils";
import React, { useEffect, useState } from "react";
import { combineLatest, EMPTY, map, merge, of, pairwise, scan, startWith, switchMap, tap } from "rxjs";
import { ItemBadgeIcon } from "../../../Helpers/ProjectItem.helper";
import { AddBoardItemBadge, BoardItemBadges$, RemoveBoardItemBadge, SetBoardItemStatus } from "../Context/Project.Item.context";
import { BadgeOptions$, DepartmentOptions$, StatusOptions$ } from "../Context/Project.Objects.context";
import { ReviewDepartments$ } from "../Context/Project.Review.context";
import * as _ from 'underscore';
import { ShowUploadReviewDialog } from "./TableItemDlgs/TableItem.Upload.context";

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

const BuildTabMenuItems = (options, activeTab, type, id) => {
    if (options === SUSPENSE || activeTab === SUSPENSE)
        return SUSPENSE

    if (options === null || activeTab === null)
        return null;

    
    const isSelected = activeTab.indexOf(type) > -1;
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
    BoardItemId => 
    combineLatest([StatusMenu$(BoardItemId), BadgeMenu$(BoardItemId)]).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        map(([Status, Badges]) => ({Status, Badges}))
    ), SUSPENSE
)

const [useTableItemContextMenu, TableItemContextMenu] = bind(
    BoardItemId =>
    TableItemDependencies$(BoardItemId).pipe(
        map(({Status, Badges}) => ([
            {   label: 'Status',
                items: Status
            },
            { separator: true},
                ...Badges,
            { separator: true},
            { label: 'Edit Task'},
            { label: 'Edit Review'},
            { separator: true},
            { label: 'Upload New Review', 
              command: (evt) => ShowUploadReviewDialog(BoardItemId)
            }
        ]))
    ), SUSPENSE)

const [AutoCloseBoardItemContext,] = bind(
    visibleContextMenusChanged$.pipe(
        startWith(null),
        pairwise(),
        tap(([prev, cur]) => {
            if (prev?.ref?.current)
                prev.ref.current.hide(prev.evt);

            
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
        )
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
