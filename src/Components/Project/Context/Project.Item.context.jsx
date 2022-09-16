import { bind, SUSPENSE } from "@react-rxjs/core";
import React, { useContext, useEffect, useReducer, useState } from "react";
import { BadgeOptions$, BoardItems$, ColumnSettings$, ProjectReference$, RawBoardItems$, TagOptions$, useFilteredBoardItemIds, useTagOptions } from "./Project.Objects.context";
import { contextBinder, createSignal, partitionByKey } from "@react-rxjs/utils";
import { combineLatest, concatMap, distinctUntilChanged, EMPTY, from, map, of, merge,
    shareReplay, switchMap, tap, withLatestFrom } from "rxjs";
import { ReviewArtists$, ReviewById, ReviewTimeline$, useCurrentReviewId } from "./Project.Review.context";
import { FirstIfNotSecond, ReadyOrSuspend$ } from "../../../Helpers/Context.helper";
import { ProjectContext } from "./Project.context";
import { useSyncsketchReviews, useSyncsketchReviewsFromElement } from "./Project.Syncsketch.context";
import * as _ from 'underscore';
import moment from 'moment';
import { BoardId$, ProjectId$, GroupId$ } from "./Project.Params.context";
import { MondayService } from "../../../Services/Monday.service";
import { SendToastError, SendToastSuccess } from "../../../App.Toasts.context";
import { BoxService } from "@Services/Box.service";
import { reduceRight } from "underscore";
import { AllUsers$ } from "../../../App.Users.context";

const defaultStatus = {  text: 'Not Started', color: 'black' }

const [, BoardItemMap$] = bind(
    RawBoardItems$.pipe(
        // array to stream
        concatMap(itemArray => from(itemArray)),
    ), {}
);

// map board items based on id
const [BoardItemById,] = partitionByKey(
    BoardItemMap$,
    x => x.id,
)
// retrieve board item from id
const [, BoardItem$] = bind((id) => BoardItemById(id));

const _boardItemStatusMap = (boardItemId, text, color, index, column_id) => ({boardItemId, text, color, index, column_id});
const [BoardItemStatusChanged$, SetBoardItemStatus] = createSignal(_boardItemStatusMap)

const [useBoardItemStatus, BoardItemStatus$] = bind(
    (id) => 
        merge(
            BoardItem$(id).pipe(
                map(item => item.Status),
                map(status => status?.info?.color ? 
                    ({text: status.text, color: status.info.color }) : defaultStatus)
            ), BoardItemStatusChanged$.pipe(
                switchMap((params) => params.boardItemId === id ? of(params) : EMPTY),
                switchMap(params => BoardId$.pipe(
                    switchMap(boardId => MondayService.SetItemStatus(boardId, params.boardItemId, params.column_id, params.index)
                        .pipe(
                            map(result => result?.change_simple_column_value?.id ? true : false ),
                            switchMap(result => {
                                if (result) {
                                    SendToastSuccess("Item Status Updated!");
                                    return of({text: params.text, color: params.color})
                                }
                                SendToastError("Could not Update Status!");
                                return EMPTY
                            })
                        )
                    ),
                ))
            )
        ), SUSPENSE
)

const [useBoardItemArtists, BoardItemArtists$] = bind(
    (id) => 
        of(id).pipe(
            switchMap(id => {
                if (id === null)
                    return of([]);
                else if (id === SUSPENSE)
                    return of(SUSPENSE);
                return BoardItem$(id).pipe(
                    map((item) => GetPersonValues(item.Artist))
                )
            })
    ), SUSPENSE
)

const [useAssignedArtists, AssignedArtists$] = bind(
    (itemId, reviewId) => 
    combineLatest([
        ReadyOrSuspend$(itemId, BoardItemArtists$),
        ReadyOrSuspend$(reviewId, ReviewArtists$),
        BoardItemById(itemId)
    ]).pipe(
        map(([itemArtists, reviewArtists, item]) => {
            const reassigned = item.subitems?.filter(s => s.Artist?.value?.length).length > 0;
            return reassigned ? reviewArtists : itemArtists;
        })
    ), SUSPENSE
)
/*
map((item) => {
                        const artists = GetPersonValues(item.Artist);
                        if (!item.subitems?.length) 
                            return artists;
                        const current = _.sortBy(item.subitems, s => s.Index?.text || -1).reverse()[0];
                        const reassigned = item.subitems.filter(s => s.Artist?.value?.length).length > 0;
                        const currentArtist = GetPersonValues(current.Artist);
                        if (currentArtist.length < 1 && reassigned)
                            return [];
                        return currentArtist.length > 0 ? currentArtist : artists;
                    })
*/
const [useBoardItemDirectors,] = bind(
    (id) => 
        BoardItem$(id).pipe(
            withLatestFrom(AllUsers$),
            map(([item, allUsers]) => GetPersonValues(item.Director, allUsers))
    ), SUSPENSE
)

// ids can potentially change between boards, but are consistent across 
// board items
const [, BoardItemColumns$] = bind(
    RawBoardItems$.pipe(
        // use the first item in list to prevent unique observables unnecessarily
        map(items => items.length > 0 ? items[0] : {}),
        // monday item columns will have the id property
        map(item => Object.keys(item)
            .filter(k => !!item[k].id)
            // only need id
            .map(k => ({id : item[k].id, title: k}))
        ),
        // array to stream
        concatMap(columnArray => from(columnArray)),
    )
)
// partition ids based on title
const [BoardItemColumnMap, BoardItemColumnMap$] = partitionByKey(
    BoardItemColumns$,
    x => x.title,
    (column$) => column$.pipe(map(x => x.id))
)

// retrieve id from column title
const [useBoardItemColumnId, BoardItemColumnId$] = bind(
    (title) => BoardItemColumnMap(title), SUSPENSE
);

const DefaultBoardItemState = {
        BoardItemId: SUSPENSE,
        CurrentReviewId: SUSPENSE,
        Filtered: false,
        Status: defaultStatus,
        SyncsketchReviews: SUSPENSE,
        Element: SUSPENSE,
        Task: SUSPENSE,
        Department: SUSPENSE,
        ReferenceFolder: SUSPENSE,
}

// store boarditem id and current reivew id as context in provider across children
const BoardItemContext = React.createContext(); 

const BoardItemProvider = ({BoardItemId, children}) => {
    const [state, setState] = useState(DefaultBoardItemState);
    const [Element, Task] = useBoardItemName(BoardItemId);
    const CurrentReviewId = useCurrentReviewId(BoardItemId);
    const FilteredBoardItemIds = useFilteredBoardItemIds();
    const Department = useBoardItemDepartment(BoardItemId)
    const Status = useBoardItemStatus(BoardItemId);
    const ReferenceFolder = useElementReference(Element);

    useEffect(() => {
        const result = { 
            BoardItemId, 
            Status,
            CurrentReviewId, 
            Filtered: FilteredBoardItemIds.indexOf(BoardItemId) >= 0,
            Element,
            Task,
            Department,
            ReferenceFolder,
        };

        if (JSON.stringify(result) !== JSON.stringify(state))
            setState(result)
    }, [BoardItemId, CurrentReviewId, FilteredBoardItemIds, Status, Element, Task, Department, ReferenceFolder]); //SyncsketchReviews]);

    return (
        <BoardItemContext.Provider value={state}>
            {children}
        </BoardItemContext.Provider>
    )
}

// return board item name as [element, task]
// board item names should be written as element / task
//  eg. minnie/rig character
const [useBoardItemName, BoardItemName$] = bind(
    (id) => 
        BoardItem$(id).pipe(
            map(item => item === SUSPENSE ? SUSPENSE : item.name),
            map(name => {

                if (name === SUSPENSE)
                    return [SUSPENSE, SUSPENSE];

                if (name.indexOf('/') < 0)
                    // no task provided
                    return [name, null]

                const nameArr = name.split('/');
                const element = nameArr.shift();

                // account for multiple / written into names
                const task = nameArr.join('/');

                return [element, task];
            }),
    ), [SUSPENSE, SUSPENSE]
)

const [useBoardItemTimeline, BoardItemTimeline$] = bind(
    (id) => 
        BoardItem$(id).pipe(
            // format to MMM DD, eg. Jan 07
            map((item) => item?.Timeline),
    ), SUSPENSE
)

const [useAssignedTimeline, AssignedTimeline$] = bind(
    (itemId, reviewId) => 
        combineLatest([
            ReadyOrSuspend$(itemId, BoardItemTimeline$),
            ReadyOrSuspend$(reviewId, ReviewTimeline$),
            BoardItemById(itemId)
        ]).pipe(
            map(([itl, rtl, item]) => {
                const reallocated = item.subitems?.filter(s => s.Timeline?.value).length > 0;
                return reallocated ? rtl : itl;
            })
    ), SUSPENSE
)
// helper function for retrieving tags
const GetItemTags = (tagsCol, tagOptions) => {
    if (!tagOptions) return [];
    
    const result = tagsCol?.value ?
    tagsCol?.value?.reduce((acc, t) => {
        if (tagOptions[t]) {
            acc.push(tagOptions[t])
        }
        return acc;
    }, []) : [];

    return result;
}
// helper function for retrieving tags
const GetItemBadges = (badgesCol, badgeOptions) => {
    if (!badgeOptions) return [];
    
    const result = badgesCol?.value ?
    badgesCol?.value?.reduce((acc, b) => {
        if (badgeOptions[b]) {
            acc.push(badgeOptions[b])
        }
        return acc;
    }, []) : [];

    return result;
}

const [useBoardItemTags,] = bind(
    (id) => 
        combineLatest([BoardItem$(id), TagOptions$]).pipe(
        map(([item, tagOptions]) => {
            if (item === SUSPENSE || tagOptions === SUSPENSE)
                return SUSPENSE;
            else if (!tagOptions || tagOptions.length < 1)
                return [];
            return GetItemTags(item.Tags, tagOptions);
        }),
    ), SUSPENSE
)
const [useBoardItemDepartment, BoardItemDepartment$] = bind(
    id =>
    BoardItem$(id).pipe(
        map(item => 
            item === SUSPENSE ? SUSPENSE :
            item?.Department?.text ? item.Department.text : null)
    ), SUSPENSE
)

const _boardItemBadgeMap = (boardItemId, entry) => ({boardItemId, entry});
const [AddBoardItemBadgeEvent$, AddBoardItemBadge] = createSignal(_boardItemBadgeMap)
const [RemoveBoardItemBadgeEvent$, RemoveBoardItemBadge] = createSignal(_boardItemBadgeMap)

const [, FetchBoardItemBadges$] = bind(
    id => 
    combineLatest([BoardItem$(id), BadgeOptions$]).pipe(
        map(([item, badgeOptions]) => {
            if (item === SUSPENSE || badgeOptions === SUSPENSE)
                return SUSPENSE;
            else if (!badgeOptions || badgeOptions.length < 1)
                return [];
            return GetItemBadges(item.Badges, badgeOptions);
        })
    )
)
const [useBoardItemBadges, BoardItemBadges$] = bind(
    (id) => 
        merge(
            FetchBoardItemBadges$(id),
            AddBoardItemBadgeEvent$.pipe(
                switchMap((params) => params.boardItemId.toString() === id.toString() ? of(params) : EMPTY),
                withLatestFrom(BoardItemColumnId$('Badges')),
                switchMap(([params, column]) => BoardId$.pipe(
                        withLatestFrom(FetchBoardItemBadges$(id), TagOptions$),
                        switchMap(([boardId, badges, options]) => {
                        
                        const currentBadges = badges
                            .map(b => options[b.Title.replace(/\s+/g, '')])
                                .filter(b => !!b);
                        const adding = options[params.entry];
                        const currentId = adding?.id;
                        
                        const nextResult = currentId ? of([...badges, adding]) : EMPTY
                        return MondayService.AddItemBadge(boardId, params.boardItemId,
                            column, currentBadges, params.entry, currentId)
                            .pipe(
                                switchMap(result => {
                                    if (result) {
                                        SendToastSuccess(`${params.entry} Badge Added`);
                                        return nextResult;
                                    }
                                    SendToastError(`Could not Add Badge "${params.entry}`);
                                    return EMPTY
                                })
                            )
                        })
                    )
                )
            ),

            RemoveBoardItemBadgeEvent$.pipe(
                switchMap((params) => params.boardItemId.toString() === id.toString() ? of(params) : EMPTY),
                withLatestFrom(BoardItemColumnId$('Badges')),
                switchMap(([params, column]) => BoardId$.pipe(
                    withLatestFrom(FetchBoardItemBadges$(id), TagOptions$),
                    switchMap(([boardId, badges, options]) => {
                    
                    const currentBadges = badges
                        .map(b => options[b.Title.replace(/\s+/g, '')])
                            .filter(b => !!b);
                    const currentId = options[params.entry].id;
                    const nextResult = badges.filter(b => b.Title.replace(/\s+/g, '') != params.entry);
                    
                    return MondayService.RemoveItemBadge(boardId, params.boardItemId,
                        column, currentBadges, params.entry, currentId)
                        .pipe(
                            switchMap(result => {
                                if (result) {
                                    SendToastSuccess(`${params.entry} Badge Removed`);
                                    return of(nextResult)
                                }
                                SendToastError(`Could not Remove Badge "${params.entry}`);
                                return EMPTY
                            })
                        )
                    })
                )
            )
        )
    ), SUSPENSE
)

const [useBoardItemLastUpdate,] = bind(
    (id) => 
        BoardItem$(id).pipe(
        map(item => item.updated_at),
        map(update => update ? moment(update).format('MMM DD HH:mm') : null)
    ), null
)

const GetPersonValues = (personCol) => {
    const values = personCol?.value?.filter(a => a && a.length > 0);
    if (!values || !values.length)
        return [];
    return values;
}

const [useElementReference, ElementReference$] = bind(
    element => combineLatest([ProjectId$, BoardId$, GroupId$, ProjectReference$]).pipe(
        switchMap(([projectId, boardId, groupId, ref]) => {
            if ([projectId, boardId, groupId, ref, element].indexOf(SUSPENSE) >= 0)
                return EMPTY;

            const key = `/BOX/${projectId}/${boardId}/${groupId}/${element}`
            const stored = sessionStorage.getItem(key);

            console.log("Fetching from cache: ", key, stored);
            if (stored)
                return of(stored);
            
            return ref === SUSPENSE? EMPTY : of(ref).pipe(
                map(ref => {
                    if (!ref?.entries || ref?.total_count < 1) return null;
        
                    return _.find(ref.entries, r => r.name.toLowerCase() === element.toLowerCase())
                }),
                tap(entry => {
                    if (entry?.id) {
                        console.log("STORING CACHE: ", key, entry.id)
                        sessionStorage.setItem(key, entry.id)
                    }
                }),
                map(entry => entry?.id ? entry.id : null)
            )
        }),
        tap(t => console.log("BOX ID?", t)),
        switchMap(id => id ? BoxService.FolderContents$(id) : of (null))
    ), SUSPENSE
)

const [useReviewCount, ReviewCount$] = bind(
    id =>
    ReadyOrSuspend$(id, BoardItem$).pipe(
        map(item => item?.subitems ? item.subitems : []),
        map(subitems => subitems.map(s => s['Feedback Department']?.text)),
        map(departments => departments.filter(s => !!s)),
        map(departments => _.reduce(departments, (acc, d) => {
            if (!acc[d])
                acc[d] = 0;
            acc[d] += 1;
            return acc;
        }, {})),
        map(departmentMap => Object.entries(departmentMap))
    ), SUSPENSE
)

const [useLastDelivered, LastDelivered$] = bind(
    id =>
    ReadyOrSuspend$(id, BoardItem$).pipe(
        map(item => item?.subitems ? item.subitems : []),
        map(subitems => subitems.map(s => s['Delivered Date']?.text)),
        map(dates => dates.length > 0 ? dates.sort().reverse()[0] : null),
        map(date => {
            if (!date) return null

            const dateArr = date.split('-');
            return moment(new Date(...dateArr)).format('MMM DD, YYYY')
        })
    ), SUSPENSE
)

const [useBoardItemDescription, BoardItemDescription$] = bind(
    id => 
    of(id).pipe(
        switchMap(id => {
            if (id === SUSPENSE || !id) return EMPTY;
            return MondayService.ItemDescription(id);
        })
    ), SUSPENSE
)

export {
    AssignedArtists$,
    AssignedTimeline$,
    BoardItemProvider, 
    useBoardItemStatus,
    BoardItemStatus$,
    BoardItemDepartment$,
    useBoardItemArtists,
    useAssignedArtists,
    useAssignedTimeline,
    useBoardItemDirectors,
    useBoardItemColumnId,
    useBoardItemName,
    useBoardItemTags,
    useBoardItemLastUpdate,
    useBoardItemBadges,
    useBoardItemDepartment,
    useBoardItemDescription,
    useLastDelivered,
    useElementReference,
    useReviewCount,
    BoardItemName$,
    BoardItemContext,
    BoardItemMap$,
    BoardItemBadges$,
    BoardItem$,
    GetPersonValues,
    GetItemTags,

    SetBoardItemStatus,
    AddBoardItemBadge,
    RemoveBoardItemBadge
}
