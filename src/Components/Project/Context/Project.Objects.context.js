import { bind, SUSPENSE } from "@react-rxjs/core";
import { BehaviorSubject, combineLatest, EMPTY, map, tap, of, switchMap, take, debounceTime, merge, 
    distinctUntilChanged, mergeMap, startWith, filter, delay, concatMap, from, distinct } from "rxjs";
import { FirebaseService } from "../../../Services/Firebase.service";
import { MondayService } from "../../../Services/Monday.service";
import { filterArtists, filterBadges, filterDepartments, filterSearch, 
    filterStatus, filterTags, sortFilteredItems } from "../Overview.filters";
import { ProjectId$, BoardId$, BoardFilters$, GroupId$, 
    BoardSorting$, BoardGrouping$ } from "./Project.Params.context";
import { combineKeys, createSignal, partitionByKey } from "@react-rxjs/utils";
import * as _ from 'underscore';
import { RemoveQueueMessage } from "../../../App.MessageQueue.context";
import { PROJ_QID } from "./Project.context";
import { BoxService } from "@Services/Box.service"
const M_GetBoardItems = ['get-boarditems', 'Retrieving Monday Board Items (Firebase)...']

const BoardItemParam$ = combineLatest([ProjectId$, BoardId$, GroupId$]).pipe(
    switchMap(params => params.filter(p => !p).length > 0 ? 
        EMPTY : of(params)),
);

const InitialBoardItems$ = BoardItemParam$.pipe(
    switchMap(params => {
        const [ProjectId, BoardId, GroupId] = params;
        return FirebaseService.BoardItems$(ProjectId, BoardId, GroupId)
    }),
    tap(() => RemoveQueueMessage(PROJ_QID, M_GetBoardItems[0])),
    tap(() => RefreshBadges()),
    tap(() => RefreshTags())
)
const BoardItemChanged$ = BoardItemParam$.pipe(
    switchMap(params => {
        const [ProjectId, BoardId, GroupId] = params;
        return FirebaseService.BoardItemsChanged$(ProjectId, BoardId, GroupId)
    }),
    tap(() => RemoveQueueMessage(PROJ_QID, M_GetBoardItems[0])),
    tap(() => RefreshBadges()),
    tap(() => RefreshTags())
)

const BoardItemStream$ = merge(InitialBoardItems$.pipe(
    concatMap(reviewArr => from(reviewArr))
), BoardItemChanged$);

const [BoardItemById, BoardItemIds$] = partitionByKey(
    BoardItemStream$, x => x.id
)

// --- holding unfiltered board items
const BoardItemsMap$ = combineKeys(BoardItemIds$, BoardItemById);

const [useRawBoardItems, RawBoardItems$] = bind(
    BoardItemsMap$.pipe(
        map(x => Array.from(x.values())),
    ), []
)

// --- use unfiltered board items to extrapolate departments options ---
//          * this avoids frequent calls from department change emissions
const [, DepartmentOptions$] = partitionByKey(
    BoardItemStream$.pipe(
        filter(x => x?.Department?.value),
        map(x => x.Department.value),
        map(x => x[0]),
        distinct()
    ),
    x => x
);

const [useDepartmentOptions,] = bind(
    DepartmentOptions$.pipe(
        map(options => options.concat(['All Departments']))
    ), ['All Departments']
)

const [DepartmentChanged$, SetDepartment] = createSignal();
const [useDepartment, Department$] = bind(
    DepartmentChanged$, 'All Departments'
)

const [useProject, Project$] = bind(
    ProjectId$.pipe(
        switchMap( id => FirebaseService.Project$(id)
            .pipe(take(1))
        ),
    ), SUSPENSE
);

const [useBoard, Board$] = bind(
    combineLatest([ProjectId$, BoardId$]).pipe(
        // ensure all params have values
        switchMap(params => params.filter(p => !p || p === SUSPENSE).length ? EMPTY : of(params)),
        switchMap(([projectId, boardId]) => FirebaseService.Board$(projectId, boardId))
    ), SUSPENSE
);

const [useColumnSettings, ColumnSettings$] = bind(
    BoardId$.pipe(

        switchMap((boardId) => {
            const key = "Monday/ColumnSettings/" + boardId;
            const stored = sessionStorage.getItem(key);

            if (stored) {
                try {
                    const data = JSON.parse(data);
                    return of(data);
                } catch { }
            }
            return MondayService.ColumnSettings(boardId).pipe(
                take(1),
                tap(settings => sessionStorage.setItem(key, JSON.stringify(settings)))
            )
        })
    ), null
);

// --- filtered board items ---
const [useDepartmentBoardItems, DepartmentBoardItems$] = bind(
    combineLatest([RawBoardItems$, Department$]).pipe(
        map(([items, Department]) => {
            if (Department === 'All Departments')
                return items;
            
            return filterDepartments(items, Department);
        })
    )
);

const [useDepartmentElements, DepartmentElements$] = bind(
    DepartmentBoardItems$.pipe(
        map(items => _.pluck(items, 'name')
            .map(name => ParseBoardItemName(name))
        )
    )
)

const [useFilteredBoardItemIds, FilteredBoardItemIds$] = bind(
    combineLatest([
        DepartmentBoardItems$, BoardFilters$
    ]).pipe(
        map(([items, filters]) => {
            let filtered = [...items];
            if (filters.Status)
                filtered = filterStatus(filtered, filters.Status);
            if (filters.Artists)
                filtered = filterArtists(filtered, filters.Artists);
            if (filters.Search)
                filtered = filterSearch(filtered, filters.Search);
            if (filters.Badges)
                filtered = filterBadges(filtered, filters.Badges);
            if (filters.Tags)
                filtered = filterTags(filtered, filters.Tags);
            return filtered;
        }),
        map(items => _.pluck(items, 'id'))
    ), []
)
// --- filtered, sorted and grouped board items ---
const [useGroupedBoardItems, GroupedBoardItems$] = bind(
    combineLatest([DepartmentBoardItems$, BoardSorting$, BoardGrouping$]).pipe(
        map(([filtered, sortParams, Grouping]) => {
            const sorted = sortFilteredItems(filtered, sortParams);
            
            return _.groupBy(sorted, (i) => {
                if (Grouping == 'Status') {
                    return !!i.Status && !!i.Status.text ? i.Status.text : 'Not Started';
                } 
                else if (Grouping == 'Department') {
                    return i.Department.text
                }
                else if (Grouping == 'Element'){
                    if (i.name.indexOf('/'))
                        return i.name.split('/')[0];
                    return 'Other'
                }

                return '';
            });
        }),
        map((grouped) => 
            Object.keys(grouped).reduce((acc, group) => 
                [...acc, [group, _.pluck(grouped[group], 'id')]]
            , [])
        ),
    ), []
)


const [useGroupOptions, GroupOptions$] = bind(
    Board$.pipe(
        switchMap(board => board ? of(board.groups) : EMPTY)
    ), []
);
const [useStatusOptions, StatusOptions$] = bind(
    ColumnSettings$.pipe(
        switchMap(settings => settings ? of(settings) : EMPTY),
        map(settings => settings['Status'] ? settings['Status'] : []),
        map(status => {
            let indices = Object.keys(status.labels);
            let result = [];
            indices.forEach(i => {
                let option = status.labels_colors[i];
                option.index = i;
                option.column_id = status.id;
                option.label = status.labels[i];
                option.className = 'pm-status-option';
                option.style = {background: option.color};
                result.push(option);
            });
            return _.sortBy(result, r => r.label);
        })
    ), []
);

const _TagsSubject$ = new BehaviorSubject(SUSPENSE);
const RefreshTags = () => {
    MondayService.AllTags().pipe(
        debounceTime(1000),
        take(1))
        .subscribe((res) => _TagsSubject$.next(res));
}
const [useTagOptions, TagOptions$] = bind(
    _TagsSubject$, SUSPENSE
)

const _BadgesSubject$ = new BehaviorSubject(SUSPENSE);
const RefreshBadges = () => {
    FirebaseService.AllBadges$.pipe(
            debounceTime(1000),
            take(1)
        )
        .subscribe(res =>
        _BadgesSubject$.next(res)
    )
}

const [useBadgeOptions, BadgeOptions$] = bind(
    _BadgesSubject$, SUSPENSE
)

const [useGroup, Group$] = bind(
    combineLatest([GroupOptions$, GroupId$]).pipe(
        switchMap(([groups, groupId]) => {
            if (!groups || groups.length < 1 || !groupId) return EMPTY

            const group = _.first(
                _.filter(groups, (g) => {
                    return g.id === groupId;
                    })
                );
            return of(group);
                    
        }),
    ), null
)
const [useBoardItemsCount, BoardItemsCount$] = bind(
    FilteredBoardItemIds$.pipe(
        map(items => items && Array.isArray(items) ? items.length : 0)
    ), 0
)


const [useProjectReference, ProjectReference$] = bind(
    combineLatest([Project$, Board$, Group$]
    ).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        map(([project, board, group]) => {
            if (!project || !board || !group) return null;
            
            return project.nesting
            .concat(['Reference'])
            .concat(board.name.split('/'))
            .concat([group.title])
            .filter(f => f != null && f.length > 0)
        }),
        map(folders => _.reject(folders, (f, i) => {
            return i > 0 && folders[i - 1] === f;
            })
        ),
        switchMap(folders => {
            const key = '/BOX/' + folders.join('/')
            const stored = sessionStorage.getItem(key);

            console.log("Fetching from cache: ", key, stored);
            if (stored)
                return of(stored);

            return BoxService.FindFolderRecursively$(folders).pipe(
                tap(folder => {
                    if (folder?.id) {
                        console.log("STORING CACHE: ", key, folder.id)
                        sessionStorage.setItem(key, folder.id);
                    }
                }),
                map(folder => folder?.id ? folder.id : null)
            );
        }),
        switchMap(id => id ? BoxService.FolderContents$(id) : of(null))
    ), SUSPENSE
)
export {
    ColumnSettings$,
    RawBoardItems$,
    Board$,
    Project$,
    Group$,
    Department$,
    TagOptions$,
    BadgeOptions$,
    DepartmentOptions$,
    StatusOptions$,
    DepartmentBoardItems$,
    FilteredBoardItemIds$,
    GroupedBoardItems$,
    ProjectReference$,

    SetDepartment,
    RefreshBadges,
    RefreshTags,

    useBoard,
    useGroupedBoardItems,
    useProject,
    useGroup,
    useDepartmentOptions,
    useDepartment,
    useGroupOptions,
    useBoardItemsCount,
    useTagOptions,
    useBadgeOptions,
    useStatusOptions,
    useProjectReference,
    useFilteredBoardItemIds
}