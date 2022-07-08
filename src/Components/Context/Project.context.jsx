import { BehaviorSubject, shareReplay, combineLatest, switchMap, EMPTY, of, map, tap, take } from "rxjs";
import { FirebaseService } from "../../Services/Firebase.service";
import * as _ from 'underscore';
import { MondayService } from "../../Services/Monday.service";
import { ApplicationObservables } from "./Application.context";

export const ProjectState = {
    params: {
        View: 'Table',
        Department: null,
        ProjectId: null,
        BoardId: null,
        GroupId: null,
        Grouping: 'Element',
        Sorting: 'Name',
        ReverseSorting: 'false',
    },

    filters: {
        Tag: null,
        Search: '',
        Artist: null,
        Directors: null,
        Status: '',
        Tags: '',
        Badges: '',
        Timeline: null,
    },

    objects: {
        Board: null,
        Group: null,
        Items: [],
        DepartmentOptions: [],
        GroupOptions: [],
        ArtistOptions: [],
        BadgeOptions: {},
        TagOptions: {},
        DirectorOptions: [],
        StatusOptions: [],
    },

    subscriptions: [],
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
    static _BadgeOptions = new BehaviorSubject({});
    static BadgeOptions$ = ProjectObservables._BadgeOptions.asObservable().pipe(shareReplay(1));

    static _TagOptions = new BehaviorSubject({});
    static TagOptions$ = ProjectObservables._TagOptions.asObservable().pipe(shareReplay(1));

    static StatusOptions$ = ProjectObservables.ColumnSettings$.pipe(
        map(settings => settings['Status'] ? settings['Status'] : []),
        map(status => {
            let indices = Object.keys(status.labels);
            let result = [];
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
    static _Items = new BehaviorSubject([]);
    static Items$ = ProjectObservables._Items.asObservable().pipe(shareReplay(1));

    static ItemsSubscription = null;
    static ItemsSubscriptionHandler = combineLatest(
            [ProjectObservables.ProjectId$, 
                ProjectObservables.BoardId$, 
                ProjectObservables.GroupId$]
        ).pipe(
            switchMap(([projectId, boardId, groupId]) => 
            !!projectId && !!boardId && !!groupId ? 
              of([projectId, boardId, groupId]) : EMPTY
        ),
        ).subscribe(([projectId, boardId, groupId]) => {

            if (ProjectObservables.ItemsSubscription !== null) {
                console.log("UNSUBSCRIBING ITEMS SUBSCRIPTION");

                ProjectObservables.ItemsSubscription.unsubscribe();
                ProjectObservables._Items.next([]);
            }

            ProjectObservables.ItemsSubscription = 
                FirebaseService.ItemsChanged$(projectId, boardId, groupId).pipe(
                    //Force Tags refresh, but return to the changes observable
                    switchMap(changes => ProjectObservables.RefreshTags$.pipe(
                        switchMap(result => of(changes))
                    )),
                    switchMap(changes => ProjectObservables.RefreshBadges$.pipe(
                        switchMap(result => of(changes)),
                    )),
                    switchMap(changes => ProjectObservables.Items$.pipe(take(1))
                        .pipe(
                            map(previous => ProjectObservables.OnItemsChange(previous, changes))
                        )
                    )
                )

        .subscribe((result) => ProjectObservables._Items.next(result));
    });

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

    static RefreshBadges = () => {
        FirebaseService.AllBadges$.pipe(take(1)).subscribe((badges) => {
            ProjectObservables._BadgeOptions.next(badges);
        });
    }
    static RefreshTags = () => {
        MondayService.AllTags().pipe(take(1)).subscribe((tags) => {
            ProjectObservables._TagOptions.next(tags)
        });
    }

    static RefreshBadges$ = FirebaseService.AllBadges$.pipe(
        tap(t => ProjectObservables._BadgeOptions.next(t)),
        take(1)
    )

    static RefreshTags$ = MondayService.AllTags().pipe(
        tap(t => ProjectObservables._TagOptions.next(t)),
        take(1)
    )

    static OnItemsChange = (last, changes) => {
        console.info("ITEMS CHANGED", changes);
        const added = changes.filter(d => d.type === 'added').map(d => d.doc.data());
        const removed = changes.filter(d => d.type === 'removed').map(d => d.doc.data());
        const modified = changes.filter(d => d.type === 'modified').map(d => d.doc.data());
        
        const removedIds = _.pluck(removed, 'id');
        const modifiedIds = _.pluck(modified, 'id');
        const toFilter = removedIds.concat(modifiedIds);

        const filtered = _.filter(last, l => toFilter.indexOf(l.id) < 0);
        const updated = added.concat(modified);
        const items = filtered.concat(updated);
        return items;
    }

    static Unsubscribe = (subs) => {
        subs.forEach((s) => s.unsubscribe());
        ProjectObservables.ItemsSubscription.unsubscribe();
        
    }

    static Initialize(subs, dispatch) {

        subs.push(
            ProjectObservables.ProjectId$.subscribe((id) => 
            dispatch({type: 'ProjectId', value: id}))
        );

        subs.push(
            ProjectObservables.BoardId$.subscribe((id) => 
            dispatch({type: 'BoardId', value: id}))
        );

        subs.push(
            ProjectObservables.StatusOptions$.subscribe((settings) => 
            dispatch({type: 'StatusOptions', value: settings}))
        )
        subs.push(
            ProjectObservables.GroupId$.subscribe((id) => 
            dispatch({type: 'GroupId', value: id}))
        );

        subs.push(
            ProjectObservables.Items$.subscribe((items) => 
            dispatch({type: 'Items', value: items}))
        );
        
        subs.push(
            ProjectObservables.Board$.subscribe((board) => 
              dispatch({type: 'Board', value: board}))
        );
        
        subs.push(
            ProjectObservables.Group$.subscribe((group) => 
            {
              dispatch({type: 'Group', value: group});
            })
        );

        subs.push(
            ProjectObservables.BadgeOptions$.subscribe((tags) => 
            {
              dispatch({type: 'BadgeOptions', value: tags});
            })
        );

        subs.push(
            ProjectObservables.TagOptions$.subscribe((tags) => 
            {
              dispatch({type: 'TagOptions', value: tags});
            })
        );
        
        subs.push(
            ProjectObservables.DepartmentOptions$.subscribe((options) => 
              dispatch({type: 'DepartmentOptions', value: options}))
        );

        subs.push(
            ProjectObservables.GroupOptions$.subscribe((options) => 
              dispatch({type: 'GroupOptions', value: options}))
        );

        subs.push(
            combineLatest([ProjectObservables.ProjectId$,
                ProjectObservables.Board$,
                ProjectObservables.Group$]
            ).subscribe(([projectId, board, group]) => {
                let titles = ['Projects', 'Overview', projectId]
                if (board.name.indexOf('/') >= 1)
                    board.name.split('/').forEach(n => titles.push(n))
                else titles.push(board.name)

                titles.push(group.title);
                ApplicationObservables.SetTitles(titles)
            })
        )

        dispatch({type: 'Subscriptions', value: subs})
    }
}

export const DispatchProjectState = (state, action) => {
    switch(action.type) {
        case 'Subscriptions' : return { ...state, Subscriptions : action.value}
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
        case 'Grouping' :
            return { ...state,
                params: { ...state.params,
                    Grouping: action.value }
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
        
        case 'BadgeOptions' : 
                return {...state,
                    objects: {...state.objects,
                        BadgeOptions: action.value }
                }

        case 'TagOptions' : 
            return { ...state,
                objects: {...state.objects,
                    TagOptions: action.value }
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
        case 'Search' :
            return { ...state,
                filters: { ...state.filters,
                    Search: action.value }
                }
        case 'Tags' :
            return { ...state,
                filters: { ...state.filters,
                    Tags: action.value}
                } 
        case 'Badges' :
            return { ...state,
                filters: { ...state.filters,
                    Badges: action.value}
                }   
        case 'Status' : 
            return { ...state,
                filters: { ...state.filters,
                    Status: action.value}
                }

        case 'Artist' : 
            return { ...state,
                filters: { ...state.filters,
                    Artist: action.value}
                }
        default: {
            console.log('Project State -- Error -- Could not find Action: ' + action);
            break;
        }
    }
};