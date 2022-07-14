import React, { useState, useEffect, useRef, useReducer, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { ProjectItem } from "./ProjectItem.component";
import { DispatchProjectState, ProjectState } from "../Context/Project.context";
import { ProjectObservables } from "../Context/Project.context";
import { ApplicationObservables } from "../Context/Application.context";
import { filterArtists, filterBadges, filterDepartments, filterSearch, filterStatus, filterTags, 
    sortFilteredItems, toggleArrFilter, toggleStatusFilter } from "./Overview.filters";
import { ProjectFilterBar } from "./ProjectFilterBar.component";
import * as _ from 'underscore';
import './Overview.component.scss'
import { Stack } from "react-bootstrap";
import { Dialog } from 'primereact/dialog';

import { ItemBadgeIcon } from "../../Helpers/ProjectItem.helper";
import DatePicker from "react-datepicker";
import { UploadReview } from "./Dialogs/UploadReview.component";
import { of } from "rxjs";

export const ProjectContext = React.createContext(ProjectState);

export const Overview = ({headerHeight}) => {
    const [state, dispatch] = useReducer(DispatchProjectState, ProjectState)
    const [searchParams, setSearchParams] = useSearchParams();
    const [filteredItems, setFilteredItems] = useState([]);

    const [badgeFilters, setBadgeFilters] = useState(null);
    const [tagFilters, setTagFilters] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [artistFilters, setArtistFilters] = useState(null);

    const [itemCount, setItemCount] = useState(0);
    const filterBarRef = useRef();
    const offsetY = headerHeight + filterBarRef?.current ?
                filterBarRef.current.clientHeight : 0;

    useEffect(() => {
        const params = state.params;
        const filters = state.filters;
        const BoardId = searchParams.get('BoardId');
        const ProjectId = searchParams.get('ProjectId');
        const GroupId = searchParams.get('GroupId');

        const Department = searchParams.get('Department');
        const View = searchParams.get('View');
        const Sorting = searchParams.get('Sorting');
        const ReverseSorting = searchParams.get('ReverseSorting');
        const Tags = searchParams.get('FilterTags');
        const Badges = searchParams.get('FilterBadges');
        const Status = searchParams.get('FilterStatus');
        const Artist = searchParams.get('FilterArtist');
        const Grouping = searchParams.get('Grouping');

        let Search = searchParams.get('Search');
        if (!Search) Search = ''; // value cannot be null!

        if (ProjectId !== state.params.ProjectId)
            ProjectObservables.SetProjectId(ProjectId);

        if (BoardId !== state.params.BoardId)
            ProjectObservables.SetBoardId(BoardId);

        if (GroupId !== state.params.GroupId) 
            ProjectObservables.SetGroupId(GroupId);

        if (Department !== params.Department && Department) 
            dispatch({type: 'Department', value: Department})

        if (View && View !== params.View) 
            dispatch({type: 'View', value: View});
        
        if (Sorting && Sorting !== params.Sorting) 
            dispatch({type: 'Sorting', value: Sorting});

        if (ReverseSorting && ReverseSorting !== params.ReverseSorting) 
            dispatch({type: 'ReverseSorting', value: ReverseSorting});   

        if (Search !== filters.Search)
            dispatch({type: 'Search', value: Search});

        if (Tags !== filters.Tags)
            dispatch({type: 'Tags', value: Tags});

        if (Badges !== filters.Badges)
            dispatch({type: 'Badges', value: Badges});

        if (Status !== filters.Status)
            dispatch({type: 'Status', value: Status});

        if (Artist !== filters.Artist)
            dispatch({type: 'Artist', value: Artist});

        if (Grouping !== params.Grouping && Grouping)
            dispatch({type: 'Grouping', value: Grouping});

    }, [searchParams, state.params])

    //subscribe to state observables
    useEffect(() => {
        
        ApplicationObservables.SetPrimaryColor('Projects');
        ProjectObservables.Initialize([], dispatch);

        return () => ProjectObservables.Unsubscribe(state.Subscriptions);
    }, [])

    useEffect(() => {
        const filters = state.filters;
        const params = state.params;

        let filtered = state.objects.Items;
        filtered = filterDepartments(filtered, params.Department);
        filtered = filterStatus(filtered, filters.Status);
        filtered = filterArtists(filtered, filters.Artist);
        filtered = filterSearch(filtered, filters);
        filtered = filterBadges(filtered, filters.Badges);
        filtered = filterTags(filtered, filters.Tags);
        setItemCount(filtered.length);
        const sorted = sortFilteredItems(filtered, params);
        
        const nested = _.groupBy(sorted, (i) => {
            if (state.params.Grouping == 'Status') {
                return !!i.Status && !!i.Status.text ? i.Status.text : 'Not Started';
            } 
            else if (state.params.Grouping == 'Department') {
                return i.Department.text
            }
            else if (state.params.Grouping == 'Element'){
                if (i.name.indexOf('/'))
                    return i.name.split('/')[0];
                return 'Other'
            }
            return '';
        });

        setFilteredItems(nested);
    }, [state.objects.Items, state.params, state.filters]);

    useEffect(() => {
        if (!state.params.Department)
            dispatch({type: 'Department', value: state.objects.DepartmentOptions[0]})
    }, [state.objects.DepartmentOptions, state.params.Department])

    useEffect(() => {
        const TagOptions = state.objects.TagOptions;
        const Tags = state.filters.Tags;

        if (!Tags || Tags.length < 1) {
            setTagFilters(null);
            return;
        }

        const result = Tags.split(',').filter(t => TagOptions[t]).map((t) =>
        <div key={TagOptions[t].id} className="pm-tag-filter" 
            onClick={(evt) => toggleArrFilter(t, 'Tags', searchParams, setSearchParams)}>
            {'#' + t}
        </div>)

        setTagFilters(result)
    }, [state.objects.TagOptions, state.filters.Tags])

    useEffect(() => {
        const status = state.filters.Status;

        if(!status || status.length < 1) {
            setStatusFilter(null);
            return;
        }

        setStatusFilter(<div key="status-filter" className="pm-tag-filter" 
            onClick={(evt) => toggleArrFilter(status, 'Status', searchParams, setSearchParams)}>
                {'#' + status}
        </div>)
    }, [state.filters.Status]);

    useEffect(() => {
        const Artists = state.filters.Artist;

        if (!Artists || Artists.length < 1) {
            setArtistFilters(null);
            return;
        }
        
        setArtistFilters(Artists.split(',')
            .map((t) =>
                <div key={t} className="pm-tag-filter" 
                    onClick={(evt) => toggleArrFilter(t, 'Artist', searchParams, setSearchParams)}>
                    {'#' + t}
                </div>)
        )

    }, [state.filters.Artist])

    useEffect(() => {
        const BadgeOptions = state.objects.BadgeOptions;
        const Badges = state.filters.Badges;

        if (!Badges || Badges.length < 1) {
            setBadgeFilters(null);
            return;
        }
        setBadgeFilters(Badges.split(',')
            .filter(t => BadgeOptions[t])
            .map((t) =>
                <div key={t} className="pm-tag-filter" 
                    onClick={(evt) => toggleArrFilter(t, 'Badges', searchParams, setSearchParams)}>
                    {'#' + t}
                </div>)
        )
    }, [state.filters.Badges, state.objects.BadgeOptions])
    
    const ClearSearch = (evt) => {
        evt.preventDefault();
        searchParams.set('Search', '');
        setSearchParams(searchParams);
    }

    return (
    <ProjectContext.Provider value={state}>
        <div ref={filterBarRef}>
            <ProjectFilterBar filters={state.filters} params={state.params} 
                GroupOptions={state.objects.GroupOptions} Group={state.objects.Group}
                DepartmentOptions={state.objects.DepartmentOptions} />
        </div>
        <ScrollingPage key="page_scroll" offsetY={offsetY}>
            <div id="Overview_Items">
                <Stack direction="horizontal" gap={3}>
                    <div className="pm-tag-filter" style={{color: '#aaa', fontWeight: 400}}>
                        { itemCount.toString() + ' tasks...' }
                    </div>
                    {
                        state.filters.Search && state.filters.Search.trim().length > 0 ?
                        <div className="pm-tag-filter" 
                        onClick={ClearSearch}
                        style={{color: '#aaa', fontWeight: 400}}>
                            (Searched: {state.filters.Search})
                        </div> : null
                    }
                    {
                        artistFilters
                    }
                    {
                        statusFilter
                    }
                    {
                        tagFilters
                    }
                    {
                        badgeFilters
                    }
                </Stack>
            {
                _.filter(Object.keys(filteredItems), (i) => i !== 'Other').map( i => 
                   <div key={i} className="pm-item-container">
                       <div className="pm-element">{i}</div>
                        {
                        filteredItems[i].map(item => 
                            <div key={item.id} className="pm-task-conainer">
                                <ProjectItem projectItem={item}
                                    grouping={state.params.Grouping}
                                    setSearchParams={setSearchParams}
                                    searchParams={searchParams}/>
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