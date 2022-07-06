import { BehaviorSubject, shareReplay, combineLatest, switchMap, EMPTY, of, map } from "rxjs";
import { FirebaseService } from "../../Services/Firebase.service";
import * as _ from 'underscore';
import { MondayService } from "../../Services/Monday.service";

export const ProjectState = {
    params: {
        View: 'Table',
        Department: null,
        ProjectId: null,
        BoardId: null,
        GroupId: null,
        Sorting: 'Name',
        ReverseSorting: false
    },

    filters: {
        Status: [],
        Tags: [],
        Timeline: [],
    },

    objects: {
        Board: null,
        Group: null,
        Items: [],
        DepartmentOptions: [],
        GroupOptions: [],
        StatusOptions: [],
        ArtistOptions: [],
        DirectorOptions: [],
        StatusOptions: [],
    },
}

export class ProjectObservables {
    static _ProjectId = new BehaviorSubject(null);
    static ProjectId$ = ProjectObservables._ProjectId.asObservable().pipe(shareReplay(1));

    static _BoardId = new BehaviorSubject(null);
    static BoardId$ = ProjectObservables._BoardId.asObservable().pipe(shareReplay(1));

    static _GroupId = new BehaviorSubject(null);
    static GroupId$ = ProjectObservables._GroupId.asObservable().pipe(shareReplay(1));
    
    static Board$ = combineLatest(
            [ProjectObservables.ProjectId$, ProjectObservables.BoardId$]
        ).pipe(
        switchMap(([projectId, boardId]) => 
            !!boardId && !!projectId ? 
                FirebaseService.Board$(projectId, boardId) : EMPTY),
        shareReplay(1)
    );

    static ColumnSettings$ = ProjectObservables.BoardId$.pipe(
        switchMap((boardId) => MondayService.ColumnSettings(boardId)),
        shareReplay(1)
    )

    static StatusOptions$ = ProjectObservables.ColumnSettings$.pipe(
        map(settings => settings['Status'] ? settings['Status'] : []),
        map(status => {
            let indices = Object.keys(status.labels);
            let result = [];
            console.log(status);
            indices.forEach(i => {
                let option = status.labels_colors[i];
                option.index = i;
                option.column_id = status.id;
                option.label = status.labels[i];
                result.push(option);
            });
            return _.sortBy(result, r => r.label);
        })
    )

    static Items$ = combineLatest(
            [ProjectObservables.ProjectId$, 
                ProjectObservables.BoardId$, 
                ProjectObservables.GroupId$]
        ).pipe(
        switchMap(([projectId, boardId, groupId]) => 
        !!projectId && !!boardId && !!groupId ? 
            FirebaseService.Items$(projectId, boardId, groupId) : EMPTY
            ),
        shareReplay(1)
    );

    static GroupOptions$ = ProjectObservables.Board$.pipe(
        switchMap(board => board ? of(board.groups) : EMPTY),
        shareReplay(1)
    );

    static Group$ = combineLatest(
        [ProjectObservables.GroupOptions$, ProjectObservables.GroupId$]
    ).pipe(
        switchMap(([groups, groupId]) => {
            if (!groups || groups.length < 1 || !groupId) return EMPTY

            const group = _.first(
                _.filter(groups, (g) => {
                    return g.id === groupId;
                    })
                );
            return of(group);
                    
        }),
        shareReplay(1)
    );

    static DepartmentOptions$ = ProjectObservables.Items$.pipe(
        map(items => items ? 
            _.uniq(_.flatten(_.map(items, i => i.Department.value))) : []
        ),
        map(departments => {
            departments.push('All Departments')
            return departments;
        }),
        shareReplay(1)
    );

    static SetProjectId = (id) => ProjectObservables._ProjectId.next(id);
    static SetBoardId = (id) => ProjectObservables._BoardId.next(id);
    static SetGroupId = (id) => {
        ProjectObservables._GroupId.next(id)
    };
}

export const DispatchProjectState = (state, action) => {
    switch(action.type) {
        case 'ProjectId' : 
            return { ...state, 
                params: { ...state.params, 
                    ProjectId: action.value }
                }
        case 'BoardId' : 
            return { ...state, 
                params: { ...state.params, 
                    BoardId: action.value }
                };
        case 'GroupId' :
            return { ...state, 
                params: { ...state.params, 
                    GroupId: action.value }
                }
        case 'Department' : 
            return { ...state, 
                params: { ...state.params, 
                    Department: action.value }
                }
        case 'Items' : 
            return { ...state, 
                objects: { ...state.objects, 
                    Items: action.value }
                }
        case 'StatusOptions' :
            return { ...state,
                objects: { ...state.objects,
                    StatusOptions: action.value }
                }
        case 'Board' :
            return { ...state, 
                objects: { ...state.objects, 
                    Board: action.value }
                }

        case 'Group' :
            return { ...state, 
                objects: { ...state.objects, 
                    Group: action.value }
                }

        case 'GroupOptions' :
            return { ...state, 
                objects: { ...state.objects, 
                    GroupOptions: action.value }
                }

        case 'DepartmentOptions' : 
            return { ...state, 
                objects: { ...state.objects, 
                    DepartmentOptions: action.value }
                }
            
        case 'View' : 
            return { ...state,
                params: { ...state.params,
                    View: action.value }
                }

        case 'Sorting' : 
            return { ...state,
                params: { ...state.params,
                    Sorting: action.value }
                }
        case 'ReverseSorting' : 
            return { ...state,
                params: { ...state.params,
                    ReverseSorting: action.value }
                }
                
        default: {
            console.log('Project State -- Error -- Could not find Action: ' + action);
            break;
        }
    }
};