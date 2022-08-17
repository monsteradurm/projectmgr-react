import React, { useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Stack } from 'react-bootstrap';
import { ProjectArtist } from '../ProjectArtist.component';
import { Panel } from 'primereact/panel';
import { Menubar} from 'primereact/menubar';
import { ScrollPanel } from 'primereact/scrollpanel'
import moment from 'moment';
import { ReviewItem } from './ReviewItem.component';
import * as _ from 'underscore';
import { ItemBadgeIcon } from '@Helpers/ProjectItem.helper';
import { Button } from 'primereact/button';
import { toggleArrFilter, toggleStatusFilter } from '../Overview.filters';
import { DispatchProjectItemState, ProjectItemState } from './ProjectItem.context';
import { ItemSummary } from './ItemSummary.component';
import { ProjectContext } from '@Components/Project/Overview.component';
import { ReferenceViewer } from '@Components/Box/ReferenceViewer';
import { useBoolean } from 'react-hanger';
import { ProjectItemHeader } from './ProjectItemHeader';
import { ApplicationContext } from "@/Application.component";

import useString from '../../Hooks/useString';
import { FilterItemArtists } from '../../../Helpers/ProjectItem.helper';

export const ProjectItemContext = React.createContext(ProjectItemState);

const formatTimeline = (tl) => {
    if (!tl.text || tl.text.length < 1 || tl.text.indexOf(' - ') < 0)
        return 'No Timeline';
    const range = tl.text.split(' - ');

    return range.map(d => moment(d).format('MMM DD')).join(' - ');
}

export const ProjectItem = ({ projectItem, grouping, setSearchParams, searchParams,
        mouseOverItem}) => {
    const [state, dispatch] = useReducer(DispatchProjectItemState, ProjectItemState);
    const [reviewsTab, setReviewsTab] = useState(null);
    const [referenceTab, setReferenceTab] = useState(null);
    const [summaryTab, setSummaryTab] = useState(null);

    const [reviewTabItems, setReviewTabItems] = useState([]);
    const [referenceTabItems, setReferenceTabItems] = useState([]);

    const [tabHTML, setTabHTML] = useState(null);
    const [reviewsHTML, setReviewsHTML] = useState(null);
    const [referenceHTML, setReferenceHTML] = useState(null);
    const [summaryHTML, setSummaryHTML] = useState(null);
    const collapsed = useBoolean(true);
    const reviewLink = useString(null);

    const projectContext = useContext(ProjectContext);
    const appContext = useContext(ApplicationContext);

    const { Status, Artist, Director, Timeline, Reviews, Reference, Tags, Badges, 
            LastUpdate, Element, Task } = state.item;

    const { ActiveTab } = state.params;
    const { TagOptions, DepartmentOptions, BadgeOptions, StatusOptions } = projectContext.objects;

    const { CurrentReview} = projectItem;
 
    useEffect(() => {
        setTabHTML(
            ActiveTab.indexOf('Review') >= 0 ? reviewsHTML :
                ActiveTab.indexOf('Summary') >= 0 ? summaryHTML
                    : referenceHTML
        )
    }, [ActiveTab, reviewsHTML, summaryHTML, referenceHTML])

    useEffect(() => {
        if (collapsed.value || ActiveTab.indexOf('Reference') < 0)
            return;
            
        const fetching = projectContext.fetching.ReferenceFolder;
        const folder = projectContext.objects.ReferenceFolder;

        setReferenceHTML(<ReferenceViewer element={Element} primary={Status.info.color}
            ready={!fetching} tag={ActiveTab.replace(' Reference', '')} parent={folder} />)

    }, [projectContext.fetching.ReferenceFolder, collapsed, ActiveTab, projectContext.objects.ReferenceFolder])

    useEffect(() => {
        dispatch({ type: 'Name', value: projectItem.name })
    }, [projectItem.name]);

    useEffect(() => {
        dispatch({ type: 'Director', value: projectItem.Director.value })
    }, [projectItem.Director]);

    useEffect(() => {
        dispatch({ type: 'Status', value: projectItem.Status})
    }, [projectItem.Status]);

    useEffect(() => {
        let badges = projectItem.Badges?.value ?
        projectItem.Badges.value.reduce((acc, b) => {
                if (TagOptions[b]) {
                    acc.push({name: b, id: TagOptions[b].id});
                }
                return acc;
            }, []) : [];
        dispatch({ type: 'Badges', value: badges });
    }, [projectItem.Badges, BadgeOptions]);

    useEffect(() => {
        let tags = projectItem.Tags?.value ?
            projectItem.Tags.value.reduce((acc, t) => {
                if (TagOptions[t]) {
                    acc.push(t)
                }
                return acc;
            }, []) : [];
        dispatch({ type: 'ItemTags', value: tags });
    }, [projectItem.Tags, TagOptions])

    useEffect(() => {   
        let grouped = {};
        const subitems = projectItem.subitems;
            if (!CurrentReview) {
                dispatch({ type: 'Timeline', value: formatTimeline(projectItem.Timeline) });
                dispatch({ type: 'Artist',
                 value: FilterItemArtists(projectItem.Artist, appContext.AllUsers) });
                dispatch({ type: 'LastUpdate', value: projectItem.updated_at });
                dispatch({ type: 'ActiveTab', value: 'Summary' });
            } else {

                grouped = _.groupBy(subitems, (i) => i['Feedback Department'].text + ' Reviews');
                Object.keys(grouped).forEach((k) => {
                    const length = grouped[k].length; 
                    grouped[k].map((sub, index) => sub.index = length - index);
                });
            }
            
            grouped['All Reviews'] = subitems;
            dispatch({ type: 'Reviews', value: grouped })
        
    }, [projectItem.subitems])

    useEffect(() => {
        if (CurrentReview === null)
            return;

        dispatch({ type: 'ActiveTab', value: 
            CurrentReview['Feedback Department'].text + ' Reviews' });

        dispatch({ type: 'Timeline', value: 
            formatTimeline(CurrentReview.Timeline?.text?.length > 0 ? 
                CurrentReview.Timeline : projectItem.Timeline)
        });
        dispatch({ type: 'Artist',
                 value: FilterItemArtists(projectItem.Artist, appContext.AllUsers) });
                 
        dispatch({ type: 'Artist', value: 
            CurrentReview.Artist?.value && CurrentReview.Artist.value.length > 0 ? 
            FilterItemArtists(CurrentReview.Artist, appContext.AllUsers) : 
            FilterItemArtists(projectItem.Artist, appContext.AllUsers)
        });

        dispatch({ type: 'LastUpdate', value: 
            CurrentReview.updated_at > projectItem.updated_at ?
            CurrentReview.updated_at : projectItem.updated_at
        });
    }, [CurrentReview]);

    useEffect(() => {
        setReviewTabItems(
            Object.keys(Reviews).map((r) => ({
                label: r, className: "pm-item-submenu", 
                    command: (evt) => dispatch({ type: 'ActiveTab', value: r })
                    })
                )
        )
    }, [Reviews]);

    useEffect(() => {
        setReferenceTabItems(
            DepartmentOptions.map((d) => {
                const allSelected =  d.indexOf('All Departments') === 0;
                const title = allSelected ? 'All Reference' : d;
                return ({ label: title, command: (event) => 
                    dispatch({ type: 'ActiveTab', value:
                        allSelected ? title : title + ' Reference' 
                    }) // dispatch
                }) // item loop
            }) // departments
        )
    }, [DepartmentOptions])

    useEffect(() => {
        const reviewSelected = ActiveTab.indexOf('Review') >= 0;
        const referenceSelected = ActiveTab.indexOf('Reference') >= 0;
        const summarySelected = ActiveTab === 'Summary';

        setReviewsTab({
            label: reviewSelected ? ActiveTab : 'Reviews',
            className: reviewSelected ? 'pm-item-tab-active' :'',
            items: reviewTabItems
        });

        setReferenceTab({
            label: referenceSelected ? ActiveTab : 'Reference', 
            className: referenceSelected ? 'pm-item-tab-active' :'',
            items: referenceTabItems
        })

        setSummaryTab({
            label: 'Summary', 
            className: summarySelected ? 'pm-item-tab-active' :'',
            command: (event) => dispatch({type: 'ActiveTab', value: 'Summary' })
        });
    }, [ActiveTab, reviewTabItems, referenceTabItems])

    const header = (options) => {
        return (
            <ProjectItemHeader mouseOverItem={mouseOverItem} projectItem={projectItem} 
                searchParams={searchParams} setSearchParams={setSearchParams}
                state={state} collapsed={collapsed} dispatch={dispatch}/>
        )
    }

    useEffect(() => {
        if (collapsed.value || ActiveTab.indexOf('Reviews') < 0) {
            setReviewsHTML(null);
            return;
        }

        const reviews = Reviews[ActiveTab];
        if (!reviews || reviews.length < 1) {
            setReviewsHTML(null);
            return;
        }

        setReviewsHTML(Reviews[ActiveTab].map((i) => 
                    <ReviewItem key={i.id} status={Status} review={i} activeTab={ActiveTab}
                        currentReview={CurrentReview} tagOptions={TagOptions} searchParams={searchParams} 
                        setSearchParams={setSearchParams}></ReviewItem>)
        );
    }, [ActiveTab, Reviews, collapsed])





    useEffect(() =>
        setSummaryHTML(
            collapsed && ActiveTab.indexOf('Summary') >= 0 ?
            <ItemSummary item={projectItem} key={projectItem.id + "_ItemSummary"}/>
    : null), [])

    return (
        <ProjectItemContext.Provider value={state}>
            <div key="task-left" className="pm-task-left">
                <ProjectArtist users={Artist} searchParams={searchParams} 
                    setSearchParams={setSearchParams} background={Status.info.color}/>
            </div>
            
            <Panel headerTemplate={header} style={{marginBottom:'10px'}} collapsed={collapsed.value} 
                onToggle={(e) => collapsed.toggle()} toggleable>

                <Menubar model={[reviewsTab, referenceTab, summaryTab]}/>
                {
                    <ScrollPanel style={{width: '100%', height: '400px'}} className="pm">
                        { tabHTML }
                    </ScrollPanel>
                }
            </Panel>
            <div key="task-right" className="pm-task-right">
                    <Stack direction="horizontal" gap={2}>
                        {
                            Badges && BadgeOptions ? 
                            Badges.map((b) => 
                                <Button className="pm-badge p-button-rounded" key={`${projectItem.id}_${b.name}`}
                                    onClick={(evt) => 
                                        toggleArrFilter(b.name, 'Badges', searchParams, setSearchParams)}
                                    tooltip={BadgeOptions[b.name].Title}
                                    tooltipOptions={{position: 'top', className:"pm-tooltip"}}
                                    style={{background: BadgeOptions[b.name].Background}}>
                                        {ItemBadgeIcon(BadgeOptions[b.name])}
                                </Button>) : null
                        }
                    </Stack>
            </div>
        </ProjectItemContext.Provider>
    )
}