import { bind } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, debounceTime, map, tap } from "rxjs";
import * as _ from 'underscore';

// --- Project Parameters ---
export const [ProjectIdChanged$, SetProjectId] = createSignal();
export const [useProjectId, ProjectId$] = bind(
    ProjectIdChanged$, null
);

export const [BoardIdChanged$, SetBoardId] = createSignal();
export const [useBoardId, BoardId$] = bind(
    BoardIdChanged$, null
); 

export const [GroupIdChanged$, SetGroupId] = createSignal();
export const [useGroupId, GroupId$] = bind(
    GroupIdChanged$, null
); 

export const [BoardViewChanged$, SetBoardView] = createSignal();
export const [useBoardView, BoardView$] = bind(
    BoardViewChanged$, 'Table'
); 

const _mapFilter = (f) => f;
export const [BoardArtistFilterChanged$, SetBoardArtistFilter] = createSignal(_mapFilter);
export const [useBoardArtistFilter, BoardArtistFilter$] = bind(
    BoardArtistFilterChanged$, ''
); 

export const [BoardDirectorFilterChanged$, SetBoardDirectorFilter] = createSignal(_mapFilter);
export const [useBoardDirectorFilter, BoardDirectorFilter$] = bind(
    BoardDirectorFilterChanged$, ''
); 

export const [BoardSearchFilterChanged$, SetBoardSearchFilter] = createSignal(_mapFilter);
export const [useBoardSearchFilter, BoardSearchFilter$] = bind(
    BoardSearchFilterChanged$, ''
)

export const [BoardTagsFilterChanged$, SetBoardTagsFilter] = createSignal(_mapFilter);
export const [useBoardTagsFilter, BoardTagsFilter$] = bind(
    BoardTagsFilterChanged$, ''
)

export const [BoardBadgeFilterChanged$, SetBoardBadgeFilter] = createSignal(_mapFilter);
export const [useBoardBadgeFilter, BoardBadgeFilter$] = bind(
    BoardBadgeFilterChanged$, ''
)
export const [BoardStatusFilterChanged$, SetBoardStatusFilter] = createSignal(_mapFilter);
export const [useBoardStatusFilter, BoardStatusFilter$] = bind(
    BoardStatusFilterChanged$, ''
)

export const [BoardSortByChanged$, SetBoardSortBy] = createSignal(_mapFilter);
export const [useBoardSortBy, BoardSortBy$] = bind(
    BoardSortByChanged$, 'Name'
)

export const [BoardReverseSortingChanged$, SetBoardReverseSorting] = createSignal(_mapFilter);
export const [useBoardReverseSorting, BoardReverseSorting$] = bind(
    BoardReverseSortingChanged$, false
)

export const [BoardGroupingChanged$, SetBoardGrouping] = createSignal(_mapFilter);
export const [useBoardGrouping, BoardGrouping$] = bind(
    BoardGroupingChanged$, 'Element'
)

export const [BoardFeedbackDepartmentChanged$, SetBoardFeedbackDepartmentFilter] = createSignal(_mapFilter);
export const [useBoardFeedbackDepartmentFilter, BoardFeedbackDepartmentFilter$] = bind(
    BoardFeedbackDepartmentChanged$, ''
)

export const [useBoardFilters, BoardFilters$] = bind(
    combineLatest(
        [BoardTagsFilter$, BoardSearchFilter$, BoardArtistFilter$, BoardDirectorFilter$,
            BoardBadgeFilter$, BoardStatusFilter$, BoardFeedbackDepartmentFilter$]
    ).pipe(
        // restructure from Array -> Object
        map(([Tags, Search, Artists, Directors, Badges, Status, FeedbackDepartment]) => (
            { Tags, Search, Artists, Directors, Badges, Status, FeedbackDepartment }
            )
        )
    ), {}
)
export const [useBoardSorting, BoardSorting$] = bind(
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