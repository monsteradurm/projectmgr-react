import { bind, SUSPENSE } from "@react-rxjs/core";
import { AddQueueMessage, MessageQueue, RemoveQueueMessage, useBusyMessage } from "../../../App.MessageQueue.context";
import { combineLatest, debounceTime, of, map, take, switchMap } from "rxjs";
import { ProjectId$, BoardId$, GroupId$,BoardView$,
        SetProjectId, SetBoardId, SetGroupId,
        SetBoardTagsFilter, SetBoardSearchFilter, SetBoardArtistFilter,
        SetBoardDirectorFilter, SetBoardSortBy,  
        SetBoardReverseSorting, SetBoardGrouping, SetBoardView,
        SetBoardBadgeFilter, SetBoardStatusFilter, SetBoardFeedbackDepartmentFilter,
        BoardTagsFilter$, BoardSearchFilter$, BoardArtistFilter$, BoardDirectorFilter$,
        BoardSortBy$, BoardReverseSorting$, BoardGrouping$, BoardStatusFilter$, BoardBadgeFilter$, BoardFeedbackDepartmentFilter$ } from "./Project.Params.context";
        import { useBoard, useDepartment, Department$, SetDepartment, useGroupedBoardItems, useProject, useGroup, useProjectReference } from "./Project.Objects.context";
import { useSyncsketchGroup, useSyncsketchProject } from "./Project.Syncsketch.context";
import * as _ from 'underscore';
import React, { useEffect, useState } from "react";

const PROJ_QID = '/Project'

const [useBoardParams, BoardParams$] = bind(
    combineLatest([
        ProjectId$, BoardId$, GroupId$, Department$, BoardView$, BoardGrouping$,
        BoardSortBy$, BoardReverseSorting$, BoardTagsFilter$, BoardSearchFilter$,
        BoardArtistFilter$, BoardDirectorFilter$, BoardStatusFilter$, BoardBadgeFilter$, 
        BoardFeedbackDepartmentFilter$
    ]).pipe(
        // account for clustered emissions
        debounceTime(500),
        // restructure as object
        map(([ProjectId, BoardId, GroupId, Department, BoardView, BoardGrouping,
            BoardSortBy, BoardReverseSorting, BoardTagsFilter, BoardSearchFilter,
            BoardArtistFilter, BoardDirectorFilter, BoardStatusFilter, BoardBadgeFilter,
            BoardFeedbackDepartmentFilter]) => 
            ({
                ProjectId, BoardId, GroupId, Department, BoardView, BoardGrouping,
                BoardSortBy, BoardReverseSorting, BoardTagsFilter, BoardSearchFilter,
                BoardArtistFilter, BoardDirectorFilter, BoardStatusFilter, BoardBadgeFilter,
                BoardFeedbackDepartmentFilter
             })
        )
    ), {}
);

const AllBoardParamFunctions = {
    SetProjectId, SetBoardId, SetGroupId, SetDepartment, SetBoardView, SetBoardGrouping,
    SetBoardSortBy, SetBoardReverseSorting, SetBoardTagsFilter, SetBoardSearchFilter,
    SetBoardArtistFilter, SetBoardDirectorFilter, SetBoardStatusFilter, SetBoardBadgeFilter,
    SetBoardFeedbackDepartmentFilter
}

const SetBoardParam = (key, val) => {
    if (AllBoardParamFunctions[key]) {
        AllBoardParamFunctions[key](val);
    }
}

const defaultProjectState = {
    Project: SUSPENSE,
    Board: SUSPENSE,
    Group: SUSPENSE,
    SyncsketchProject: SUSPENSE,
    SyncsketchGroup: SUSPENSE,
    ReferenceFolder: SUSPENSE
}


// store boarditem id and current reivew id as context in provider across children
const ProjectContext = React.createContext(); 


const ProjectProvider = ({children}) => {
const [state, setState] = useState(defaultProjectState);
const Project = useProject();
const Board = useBoard();
const Group = useGroup();
const ReferenceFolder = useProjectReference();
const SyncsketchProject = useSyncsketchProject();
const SyncsketchGroup = useSyncsketchGroup();

useEffect(() => {

    if (SyncsketchProject === SUSPENSE || SyncsketchGroup === SUSPENSE) {
        AddQueueMessage(PROJ_QID, 'init-sync', 'Retrieving Syncsketch Project & Board..');
    } else {
        RemoveQueueMessage(PROJ_QID, 'init-sync');
    }

    const result = {
        Project,
        Board, 
        Group,
        SyncsketchProject, 
        SyncsketchGroup,
        ReferenceFolder
    };

    if (JSON.stringify(result) !== JSON.stringify(state))
        setState(result)

}, [Project, Board, Group, SyncsketchProject, SyncsketchGroup, ReferenceFolder]);

return (
    <ProjectContext.Provider value={state}>
        {children}
    </ProjectContext.Provider>
)
}

export {
    PROJ_QID,
    useBoard,
    useGroupedBoardItems,
    useProject,

    useBoardParams,
    useDepartment,

    SetBoardParam,
    
    useSyncsketchProject,
    ProjectProvider,
    ProjectContext
}