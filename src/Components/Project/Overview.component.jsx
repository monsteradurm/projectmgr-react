import React, { useState, useEffect, useRef, useReducer, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { combineLatest, map, take } from "rxjs";
import { FirebaseService } from '../../Services/Firebase.service';
import * as _ from 'underscore';
import { Dropdown, FormControl, Stack } from 'react-bootstrap';
import { faUserGroup, faLayerGroup, faFilter, faArrowDownAZ, faMagnifyingGlass,
faChartBar, faChartGantt, faTable } from '@fortawesome/free-solid-svg-icons';
import { Accordion, AccordionTab } from 'primereact/accordion';
import './Overview.component.scss';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { ProjectItem } from "./ProjectItem.component";
import { DispatchProjectState, ProjectState } from "../Context/Project.context";
import { ProjectObservables } from "../Context/Project.context";
import { ApplicationObservables } from "../Context/Application.context";

export const ProjectContext = React.createContext(ProjectState);
const ViewIconMap = {
    Table: faTable,
    Chart: faChartBar,
    Gantt: faChartGantt
}

export const Overview = ({headerRef}) => {
    const [state, dispatch] = useReducer(DispatchProjectState, ProjectState)
    const [searchParams, setSearchParams] = useSearchParams();
    const [badgeOptions, setBadgeOptions] = useState([]);
    const [activeFilterIndex, setActiveFilterIndex] = useState(null);
    const filterBarRef = useRef();

    useEffect(() => {
        const BoardId = searchParams.get('BoardId');
        const ProjectId = searchParams.get('ProjectId');
        const GroupId = searchParams.get('GroupId');
        const Department = searchParams.get('Department');
        const View = searchParams.get('View');
        const Sorting = searchParams.get('Sorting');
        const ReverseSorting = searchParams.get('ReverseSorting');

        if (ProjectId !== state.params.ProjectId)
            ProjectObservables.SetProjectId(ProjectId);

        if (BoardId !== state.params.BoardId)
            ProjectObservables.SetBoardId(BoardId);

        if (GroupId !== state.params.GroupId) 
            ProjectObservables.SetGroupId(GroupId);
        
        if (Department !== state.params.Department && Department) 
            dispatch({type: 'Department', value: Department})

        if (View && View !== state.params.View) 
            dispatch({type: 'View', value: View});
        
        if (Sorting && Sorting !== state.params.Sorting) 
            dispatch({type: 'Sorting', value: Sorting});

        if (ReverseSorting && ReverseSorting !== state.params.ReverseSorting) 
            dispatch({type: 'ReverseSorting', value: ReverseSorting});   
    }, [searchParams])

    //subscribe to state observables
    useEffect(() => {
        const subs = [];

        ApplicationObservables.SetPrimaryColor('Projects');
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

        return () => subs.forEach((s) => s.unsubscribe());
    }, [])

    const filteredItems = useMemo(() => {
        let filtered = state.objects.Items;
        let dep = state.params.Department;
        if (filtered && filtered.length > 0) {
            if (dep !== 'All Departments' && !!dep)
            filtered = _.filter(filtered, i => i.Department.text.indexOf(dep) >= 0);
        }
        let nested = _.groupBy(filtered, (i) => {
            if (i.name.indexOf('/'))
                return i.name.split('/')[0];
            return 'Other'
        });
        return nested;
    }, [state.objects.Items, state.params, state.filters]);

    useEffect(() => {
        let sub = FirebaseService.AllBadges$.pipe(
            map(badges => _.groupBy(badges, (b) => b.Title)),
            take(1)
        ).subscribe(setBadgeOptions);

        return () => sub.unsubscribe();
    }, [])

    useEffect(() => {
        if (!state.params.Department)
            dispatch({type: 'Department', value: state.objects.DepartmentOptions[0]})
    }, [state.objects.DepartmentOptions, state.params.Department])

    const SetDepartment = (d) => {
        if (d !== state.params.Department) {
            searchParams.set('Department', d);
            setSearchParams(searchParams);
        }
    }

    const SetGroupId = (id) => {
        if (id !== state.params.GroupId) {
            searchParams.set('GroupId', id);
            setSearchParams(searchParams);
        }
    }
    
    const SetView = (v) => {
        if (v !== state.params.View) {
            searchParams.set('View', v);
            setSearchParams(searchParams);
        }
    }

    const SetSorting = (s) => {
        if (s !== state.params.Sorting) {
            searchParams.set('Sorting', s);
            setSearchParams(searchParams);
        }
    }

    const SetReverseSorting = (r) => {
        if (r !== state.params.ReverseSorting) {
            searchParams.set('ReverseSorting', r);
            setSearchParams(searchParams);
        }
    }
    const BadgeIcon = (b) => {
        return (<i className={b.FaIcon} 
            style={{'fontSize': '1.5em', marginRight: '0.5em'}}></i>)
    }
    const badgeMenu = useMemo(() => {
        if (!badgeOptions || badgeOptions.length < 1) return [];
        return _.map(_.flatten(Object.values(badgeOptions)), (b) => ({
            label: b.Title,
            icon: BadgeIcon(b),
            style: {background: b.Background},
            className: 'pm-status-option'
        }))
    }, [badgeOptions])
    const statusMenu = useMemo(() => 
    {
        const options = [];
        if (!state?.objects?.StatusOptions)
            return options;

        state.objects.StatusOptions.forEach((o) => 
            options.push(
                {label: o.label, 
                    id: o.index, 
                    column_id: o.column_id,
                    className: 'pm-status-option',
                    style: {background: o.color}
                }
            )
        )
        return options;
    }, [state.objects])

    return (
    <ProjectContext.Provider value={state}>
        <div key="overview_filter" className="pm-filterbar" ref={filterBarRef}>
            <Stack direction="horizontal" gap={3}>
                <Dropdown key="department_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faUserGroup} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        {state.params.Department}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light">
                    {
                        state.objects.DepartmentOptions.map((d) => 
                            <Dropdown.Item key={d} 
                            onClick= {() => SetDepartment(d)}>
                                {d}
                            </Dropdown.Item> 
                        )
                    }
                    </Dropdown.Menu>
                </Dropdown>
            
            <div style={{width:'100%'}}></div>
            <Dropdown key="items_viewing">
            <Dropdown.Toggle><FontAwesomeIcon icon={ViewIconMap[state.params.View]} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        View as {state.params.View}
                </Dropdown.Toggle>
                <Dropdown.Menu variant="light" id="sortMenu">
                    <Dropdown.Item onClick={() => SetView('Table')}>
                        Table
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetView('Gantt')}>
                        Gantt
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetView('Chart')}>
                        Chart
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <Dropdown key="items_sorting">
            <Dropdown.Toggle><FontAwesomeIcon icon={faArrowDownAZ} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        Sort by {state.params.Sorting}
                </Dropdown.Toggle>
                <Dropdown.Menu variant="light" id="sortMenu">
                    <Dropdown.Item onClick={() => SetSorting('Name')}>Name</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetSorting('Artist')}>Artist</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetSorting('Director')}>Director</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetSorting('Start Date')}>Start Date</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetSorting('End Date')}>End Date</Dropdown.Item>
                    <Dropdown.Divider></Dropdown.Divider>
                    <Dropdown.Item onClick={() => 
                        SetReverseSorting(!state.params.ReverseSorting)}>
                            Reverse
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <Dropdown key="items_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faFilter} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        Filters
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light" id="filtersMenu">
                    <Stack direction="horizontal" gap={3} className="search-tab"
                    style={{marginBottom:'10px', marginLeft:'10px'}}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        <FormControl
                            placeholder="Search By Name.."
                            style={{width:'300px'}}
                        />
                    </Stack>
                    <Accordion activeIndex={activeFilterIndex} onTabChange={(e) => setActiveFilterIndex(e.index) }>
                        <AccordionTab key="Status" header="Status">
                            Status A
                        </AccordionTab>
                        <AccordionTab key="artists" header="Artists">
                            Artist A
                        </AccordionTab>
                        <AccordionTab key="directors" header="Directors">
                            Director A
                        </AccordionTab>
                        <AccordionTab key="feedback" header="Timeline">
                            Range
                        </AccordionTab>
                        <AccordionTab key="feedback" header="Task">
                            Tag A
                        </AccordionTab>
                        <AccordionTab key="feedback" header="Feedback">
                            Tag A
                        </AccordionTab>
                        
                    </Accordion>
                        
                    </Dropdown.Menu>
                </Dropdown> 
            
            <Dropdown key="group_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faLayerGroup} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        {state.objects.Group?.title}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light">
                    {
                        state.objects.GroupOptions.map((g) => 
                            <Dropdown.Item key={g.id} 
                                onClick={() => SetGroupId(g.id)}>
                                {g.title}
                            </Dropdown.Item> 
                        )
                    }
                    </Dropdown.Menu>
                </Dropdown>   
            </Stack>
        </div>
        <ScrollingPage key="page_scroll" offsets={[headerRef, filterBarRef]}>
            <div id="Overview_Items">
            {
                _.filter(Object.keys(filteredItems), (i) => i !== 'Other').map( i => 
                   <div key={i} className="pm-item-container">
                       <div className="pm-element">{i}</div>
                        {
                        filteredItems[i].map(item => 
                            <div key={item.id} className="pm-task-conainer">
                                <ProjectItem item={item} statusMenu={statusMenu} badgeMenu={badgeMenu}
                                    departmentOptions={state.objects.DepartmentOptions}/>
                            </div>
                           )
                        }
                   </div>
                )
            }
            </div>
        </ScrollingPage>
            
    </ProjectContext.Provider>)
}