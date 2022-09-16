import { bind } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, debounceTime, map } from "rxjs";
import * as _ from 'underscore';

// --- Project Parameters ---
const [ProjectIdChanged$, SetProjectId] = createSignal();
const [useProjectId, ProjectId$] = bind(
    ProjectIdChanged$, null
);

const [BoardIdChanged$, SetBoardId] = createSignal();
const [useBoardId, BoardId$] = bind(
    BoardIdChanged$, null
); 

const [GroupIdChanged$, SetGroupId] = createSignal();
const [useGroupId, GroupId$] = bind(
    GroupIdChanged$, null
); 

const [BoardViewChanged$, SetBoardView] = createSignal();
const [useBoardView, BoardView$] = bind(
    BoardViewChanged$, 'Table'
); 

const _mapFilter = (f) => f;
const [BoardArtistFilterChanged$, SetBoardArtistFilter] = createSignal(_mapFilter);
const [useBoardArtistFilter, BoardArtistFilter$] = bind(
    BoardArtistFilterChanged$, ''
); 

const [BoardDirectorFilterChanged$, SetBoardDirectorFilter] = createSignal(_mapFilter);
const [useBoardDirectorFilter, BoardDirectorFilter$] = bind(
    BoardDirectorFilterChanged$, ''
); 

const [BoardSearchFilterChanged$, SetBoardSearchFilter] = createSignal(_mapFilter);
const [useBoardSearchFilter, BoardSearchFilter$] = bind(
    BoardSearchFilterChanged$, ''
)

const [BoardTagsFilterChanged$, SetBoardTagsFilter] = createSignal(_mapFilter);
const [useBoardTagsFilter, BoardTagsFilter$] = bind(
    BoardTagsFilterChanged$, ''
)

const [BoardBadgeFilterChanged$, SetBoardBadgeFilter] = createSignal(_mapFilter);
const [useBoardBadgeFilter, BoardBadgeFilter$] = bind(
    BoardBadgeFilterChanged$, ''
)
const [BoardStatusFilterChanged$, SetBoardStatusFilter] = createSignal(_mapFilter);
const [useBoardStatusFilter, BoardStatusFilter$] = bind(
    BoardStatusFilterChanged$, ''
)

const [BoardSortByChanged$, SetBoardSortBy] = createSignal(_mapFilter);
const [useBoardSortBy, BoardSortBy$] = bind(
    BoardSortByChanged$, 'Name'
)

const [BoardReverseSortingChanged$, SetBoardReverseSorting] = createSignal(_mapFilter);
const [useBoardReverseSorting, BoardReverseSorting$] = bind(
    BoardReverseSortingChanged$, false
)

const [BoardGroupingChanged$, SetBoardGrouping] = createSignal(_mapFilter);
const [useBoardGrouping, BoardGrouping$] = bind(
    BoardGroupingChanged$, 'Element'
)

const [useBoardFilters, BoardFilters$] = bind(
    combineLatest(
        [BoardTagsFilter$, BoardSearchFilter$, BoardArtistFilter$, BoardDirectorFilter$,
            BoardBadgeFilter$, BoardStatusFilter$]
    ).pipe(
        // restructure from Array -> Object
        map(([Tags, Search, Artists, Directors, Badges, Status]) => (
            { Tags, Search, Artists, Directors, Badges, Status }
            )
        )
    ), {}
)
const [useBoardSorting, BoardSorting$] = bind(
    combineLatest(
        [BoardSortBy$, BoardReverseSorting$]
    ).pipe(
        // restructure from Array -> Object
        map(([Sorting, ReverseSorting]) => (
            { Sorting, ReverseSorting }
            )
        )
    ), {}
)
export {
    ProjectId$,
    BoardId$,
    GroupId$,
    BoardFilters$,
    BoardSorting$,
    BoardSortBy$,
    BoardReverseSorting$,
    BoardGrouping$,
    BoardView$,
    BoardTagsFilter$, 
    BoardSearchFilter$, 
    BoardArtistFilter$, 
    BoardDirectorFilter$,
    BoardStatusFilter$,
    BoardBadgeFilter$,

    useBoardId,
    useGroupId,
    useProjectId,
    useBoardView, 
    useBoardSortBy,
    useBoardReverseSorting,
    useBoardGrouping,
    useBoardSearchFilter,
    useBoardFilters,

    SetBoardView,
    SetProjectId,
    SetBoardId,
    SetGroupId,   

    SetBoardTagsFilter,
    SetBoardSearchFilter,
    SetBoardStatusFilter,
    SetBoardArtistFilter,
    SetBoardDirectorFilter,
    SetBoardBadgeFilter,
    SetBoardGrouping,
    SetBoardSortBy,
    SetBoardReverseSorting
}