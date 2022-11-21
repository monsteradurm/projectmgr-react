import { SUSPENSE } from "@react-rxjs/core";
import { Column, DataTable, Skeleton } from "primereact";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MondayUser$ } from "../../App.Users.context"
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SetAllocationNesting, useAllocatedFeedbackDepartment, useAllocatedReviewLink, useAllocatedReviewName, useAllocatedTags, useAllocationsByProject, useAllocationsSearchFilter, useAllocationsSortBy, useAllocationsSortReversed, useMyAllocations } from "./Allocations.context";
import { Loading } from "../General/Loading";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { faArrowDownAZ, faList } from "@fortawesome/free-solid-svg-icons";
import "./Allocations.scss"
import { Stack } from "react-bootstrap";
import { ItemIdFromSyncLink, useLatestThumbnail } from "../Project/Context/Project.Syncsketch.context";
import { NavigationService } from "../../Services/Navigation.service";
import { SyncsketchService } from "../../Services/Syncsketch.service";
import { take } from "rxjs";
import { AllocationsFilterBar } from "./Allocations.FilterBar";
import * as _ from 'underscore';
import { sortBy } from "underscore";
import { toggleArrFilter, toggleStatusFilter } from "../Project/Overview.filters";
import moment from 'moment';

const onClickHandler = (e, url) => {
    if (!url)
        return;
    
    NavigationService.OpenNewTab(url, e);
}

const headerTemplate = (data) => {
    return (
        <div style={{fontSize: 20, fontWeight: 700, padding: 20, paddingLeft: 0, paddingBottom: 0, color: 'gray', marginLeft: -10}}>{data.allocationGroup}</div>
    );
}


const AllocatedThumbnail = React.memo(({URL}) => {
    const [Thumbnail, setThumbnail] = useState(SUSPENSE);

    useEffect(() => {
        if (URL === SUSPENSE)
            return;
        
        if (!URL) {
            setThumbnail(null);
            return;
        }

        const id = ItemIdFromSyncLink(URL);
        SyncsketchService.ThumbnailFromId$(id).pipe(
            take(1)
        ).subscribe(res => {
            setThumbnail(res);
        });

    }, [URL])

    if (!Thumbnail) return <div style={{height: 120}}></div>
    return (<div style={{height: 100, paddingTop: 10}}>
        {
            Thumbnail && Thumbnail !== SUSPENSE ?
            <img src={Thumbnail} className="pm-thumbnail-link"
            onClick={(e) => onClickHandler(e, URL)}
            style={{width: 120, height:80, cursor: 'pointer', border: 'solid 1px black',
            objectFit: 'cover', borderRadius:5}} /> 
            : <Skeleton width={120} height={80}/>
        }
        </div>)
})

const TaskTemplate = (item) => {
    return item.name.replace('/', ', ');
}

const BoardTemplate = (item) => {
    let nesting = [item.board_description];
    if (nesting[0].indexOf('/'))
        nesting = nesting[0].split('/');

    let projectId = _.last(nesting);
    return <span onClick={(e) => onClickHandler(e, `Projects?ProjectId=${projectId}&BoardId=${item.boardId}&GroupId=${item.groupId}`)}>
        {item.boardName.replace('/', ' / ') + ", " + item.groupTitle}</span>;
}





const ReviewTemplate = (item) => {
    const name = useAllocatedReviewName(item);
    return name;
}

const ThumbnailTemplate = (item) => {
    const link = useAllocatedReviewLink(item);
    return <AllocatedThumbnail URL={link} />
}


export const AllocationsComponent = ({headerHeight}) => {
    const allocations = useAllocationsByProject();
    const [filteredAllocations, setFilteredAllocations] = useState(SUSPENSE);
    const [searchParams, setSearchParams] = useSearchParams();
    const SortBy = useAllocationsSortBy();
    const SortByReversed = useAllocationsSortReversed();
    const Search = useAllocationsSearchFilter();
    const [statusFilter, setStatusFilter] = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState(null);
    const [tagsFilter, setTagsFilter] = useState(null);
    SetNavigationHandler(useNavigate());


    useEffect(() => {
        let titles = ['Home', 'Allocations'];

        let nesting = [searchParams.get('Nesting')];
        if (nesting[0]) {
            if (nesting[0].length)
                nesting = nesting[0].split(',');

            titles = [...titles, ...nesting];
            
        }

        SetAllocationNesting(nesting.filter(n => !!n));
        SetTitles(titles);

    }, [searchParams])

    useEffect(() => {
        let d = searchParams.get('Department');
        let t = searchParams.get('Tags');
        if (t?.indexOf(',') >= 0)
            t = t.split(',')
        else if (!!t) t = [t];

        let s = searchParams.get('Status');

        if (s && statusFilter !== s)
            setStatusFilter(s);
        else if (!s && !!statusFilter)
            setStatusFilter(null);

        if (d && departmentFilter !== d)
            setDepartmentFilter(d);
        else if (!d && !!departmentFilter)
            setDepartmentFilter(null);
        
        if (t?.length && JSON.stringify(t) !== JSON.stringify(tagsFilter))
            setTagsFilter(t)
        else if ((!t || t.length < 1) && tagsFilter?.length)
            setTagsFilter(null);
    }, [searchParams])

    useEffect(() => {
        if (allocations === SUSPENSE)
            return;

        if (!allocations || allocations.length < 1) {
            if (!Array.isArray(filteredAllocations) || filteredAllocations.length > 0)
                setFilteredAllocations([]);
            return;
        }

        let result = [...allocations];

        if (Search?.length > 0) {
            let s = Search.toLowerCase();
            result = result.filter(a => [a.boardName, a.groupTitle, a.name, a.Department?.text, 
                a.Status?.text, useAllocatedReviewName(a)].join(' ').toLowerCase().indexOf(s) >= 0)
        }
        // filter approved
        // result = result.filter(a => a.Status?.text?.indexOf('Approved') < 0)
        if (statusFilter?.length) {
            result = result.filter(a => a.Status?.text?.replace(/\s/g, '') == statusFilter)
        }

        if (departmentFilter?.length) {
            result = result.filter(a => a.Department?.text == departmentFilter)
        }

        if (tagsFilter?.length) {
            result = result.filter(a => {
                let tagGroups = useAllocatedTags(a).filter(t => t?.length > 0)
                if (tagGroups?.length < 1)
                    return false;
                return tagGroups.filter(tags => tagsFilter.filter(t => tags.indexOf(t) >= 0).length).length > 0;
            })
        }

        result = _.sortBy(result, a => {
            switch(SortBy) {
                case 'Item': return a.name + "/" + a.groupTitle + "/" + a.boardName;
                case 'Board': return a.boardName + "/" + a.groupTitle + "/" + a.name;
                case 'Review': {
                    let review = useAllocatedReviewName(a);
                    return review && review.length > 0 ? review : 'zzzzzz'
                }
                case 'Department': return a.Department?.text;
                case 'Status': return a.Status?.text;
                case 'Timeline': return a.Timeline?.text;
            }
        });
        setFilteredAllocations(SortByReversed ? result.reverse() : result);
    }, [allocations, Search, SortBy, SortByReversed, statusFilter, tagsFilter, departmentFilter])


    const TagsTemplate = (item) => {
        const [itemTags, reviewTags] = useAllocatedTags(item);
        return <Stack direction="horizontal" gap={1} style={{justifyContent: 'center'}}>
        {
            itemTags.map(t => <div key={"ItemTag_" + item.id + t}
            onClick={(e) => toggleArrFilter(t, 'Tags', searchParams, setSearchParams)}>#{t}</div>)
        }
        {
            reviewTags.map(t => <div style={{color: item?.Status?.info?.color || 'black'}} 
                key={"ItemTag_" + item.id + t}
                onClick={(e) => toggleArrFilter(t, 'Tags', searchParams, setSearchParams)}>#{t}</div>)
        }
        </Stack>
    }

    const  DepartmentTemplate = (item) => {
        let d = item.Department?.text;
        if (d?.length)
            return <span onClick={(e) => toggleStatusFilter(d, searchParams, setSearchParams, 'Department')}>{d}</span>;
        return
    }

    const StatusTemplate = (item) => {
        const department = useAllocatedFeedbackDepartment(item);
        const status = item?.Status?.text  || 'Not Started';
        return <div className="allocation-status" style={{background: item?.Status?.info?.color || 'black'}}>
            <span onClick={(e) => toggleStatusFilter(status, searchParams, setSearchParams, 'Status')}>
            {status}
            {
                (status.includes('Review') || status.includes('Feedback')) && <span style={{marginLeft: 10}}>({department})</span>
            }
            </span>
            </div>;
    }

    const TimelineTemplate = (item) => {
        if (!item?.Timeline?.text?.indexOf(' - '))
            return <></>;
        let tl = item.Timeline.text.split(' - ')
    
        let start = moment(tl[0]);
        let end = moment(tl[1]);
    
        const color = 'black';
        return <Stack direction="horizontal" gap={1}>
            <div style={{fontWeight: 700, color}}>{start.format('MMM')}</div>
            <div style={{fontWeight: 600}}>{start.format('Do')}</div>
            <div>-</div>
            <div style={{fontWeight: 700, color}}>{end.format('MMM')}</div>
            <div style={{fontWeight: 600}}>{end.format('Do')}</div>
        </Stack>
    }

    if (filteredAllocations === SUSPENSE)
        return <></>

    const today = filteredAllocations.filter(a => a.allocationGroup === 'Today');
    const week = filteredAllocations.filter(a => a.allocationGroup === 'This Week');
    const scheduled = filteredAllocations.filter(a => a.allocationGroup === 'Scheduled');
    const notimeline = filteredAllocations.filter(a => a.allocationGroup === 'No Timeline');

    const AllocationsTable = ({data, header}) => {
        return (
            <>
                <div className="allocations-header">{header}</div>
                <DataTable value={data} className="pm-allocations" rowGroupMode="rowspan" responsiveLayout="scroll">
                    <Column body={BoardTemplate} className="allocation-board"></Column>
                    <Column header="Task" body={TaskTemplate} className="allocation-task"></Column>
                    <Column header="Review" body={ReviewTemplate} className="allocation-review"></Column>
                    <Column header="Department" body={DepartmentTemplate} className="allocation-department"></Column>
                    <Column header="Status" body={StatusTemplate} className="allocation-status"></Column>
                    {
                        header !== 'No Timeline' &&
                        <Column header="Timeline" body={TimelineTemplate} className="allocation-timeline"></Column>
                    }
                    {
                        //<Column header="Tags" body={TagsTemplate} className="allocation-tags"></Column>
                    }
                    <Column body={ThumbnailTemplate}></Column>
                </DataTable>
            </>)
    }

    return <div id="allocations-page">
            <AllocationsFilterBar />
            <ScrollingPage key="page_scroll" offsetY={headerHeight}>
                <Stack direction="horizontal" gap={3}>
                    <div className="pm-tag-filter" style={{color: '#888', fontWeight: 400, fontSize: 20}}>
                        {filteredAllocations?.length} Items...
                    </div>
                    {
                        departmentFilter?.length &&
                        <div key="DepartmentFilter" className="pm-tag-filter"
                        onClick={(evt) => toggleStatusFilter(departmentFilter, searchParams, setSearchParams, 'Department')}
                            style={{color: '#888', fontWeight: 400, fontSize: 20}}>#{departmentFilter}
                        </div>
                    }

                    {
                        statusFilter?.length &&
                        <div key="DepartmentFilter" className="pm-tag-filter"
                        onClick={(evt) => toggleStatusFilter(departmentFilter, searchParams, setSearchParams, 'Status')}
                            style={{color: '#888', fontWeight: 400, fontSize: 20}}>#{statusFilter}
                        </div> 
                    }
                    {
                        tagsFilter?.length &&
                        tagsFilter.map(t => <div key={"TagFilter_" + t} className="pm-tag-filter"
                        onClick={(evt) => toggleArrFilter(t, 'Tags', searchParams, setSearchParams)}
                            style={{color: '#888', fontWeight: 400, fontSize: 20}}>#{t}
                        </div>)    
                    }
                </Stack>
            {
                today?.length > 0 &&
                <AllocationsTable data={today} header="Today" />
            }
            {
                week?.length > 0 &&
                <AllocationsTable data={week} header="This Week" />
            }
            {
                scheduled?.length > 0 &&
                <AllocationsTable data={scheduled} header="Scheduled" />
            }
            {
                notimeline?.length > 0 &&
                <AllocationsTable data={notimeline} header="No Timeline" />
            }
        </ScrollingPage>
    </div> 
}