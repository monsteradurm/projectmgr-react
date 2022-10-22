import { SUSPENSE } from "@react-rxjs/core";
import { Column, DataTable, Skeleton } from "primereact";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MondayUser$ } from "../../App.Users.context"
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SetAllocationNesting, useAllocatedFeedbackDepartment, useAllocatedReviewLink, useAllocatedReviewName, useAllocatedTags, useAllocationsByProject, useMyAllocations } from "./Allocations.context";
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

const onClickHandler = (e, url) => {
    if (!url)
        return;
    
    NavigationService.OpenNewTab(url, e);
}


const AllocatedThumbnail = React.memo(({URL}) => {
    const [Thumbnail, setThumbnail] = useState(SUSPENSE);

    useEffect(() => {
        console.log("URL", URL);
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
            console.log("HERE", res);
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
    console.log(item);
    return <span onClick={(e) => onClickHandler(e, `Projects?ProjectId=${projectId}&BoardId=${item.board.id}&GroupId=${item.group.id}`)}>
        {item.board.name.replace('/', ' / ') + ", " + item.group.name}</span>;
}

const  DepartmentTemplate = (item) => {
    return item.Department?.text;
}

const TimelineTemplate = (item) => {
    if (item?.Timeline?.text?.length)
        return item.Timeline.text;
    return <span style={{opacity: 0.5, fontStyle: 'italic'}}>'No Timeline..'</span>;
}

const StatusTemplate = (item) => {
    const department = useAllocatedFeedbackDepartment(item);
    const status = item?.Status?.text  || 'Not Started';
    return <div className="allocation-status" style={{background: item?.Status?.info?.color || 'black'}}>
        {status}
        {
            (status.includes('Review') || status.includes('Feedback')) && <span style={{marginLeft: 10}}>({department})</span>
        }
        </div>;
}

const ReviewTemplate = (item) => {
    const name = useAllocatedReviewName(item);
    return name;
}

const ThumbnailTemplate = (item) => {
    const link = useAllocatedReviewLink(item);
    return <AllocatedThumbnail URL={link} />
}
const TagsTemplate = (item) => {
    const [itemTags, reviewTags] = useAllocatedTags(item);
    return <Stack direction="horizontal" gap={1} style={{justifyContent: 'center'}}>
    {
        itemTags.map(t => <div key={"ItemTag_" + item.id + t}>#{t}</div>)
    }
    {
        reviewTags.map(t => <div style={{color: item?.Status?.info?.color || 'black'}} 
            key={"ItemTag_" + item.id + t}>#{t}</div>)
    }
    </Stack>
}

export const AllocationsComponent = ({headerHeight}) => {
    const allocations = useAllocationsByProject();
    const [searchParams, setSearchParams] = useSearchParams();
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

    }, [])


    if (allocations === SUSPENSE)
        return <></>

    return <>
            <AllocationsFilterBar />
            <ScrollingPage key="page_scroll" offsetY={headerHeight}>
                
                <DataTable value={allocations}  className="pm-allocations">
                
                <Column body={BoardTemplate} className="allocation-board"></Column>
                <Column header="Task" body={TaskTemplate} className="allocation-task"></Column>
                <Column header="Review" body={ReviewTemplate} className="allocation-review"></Column>
                <Column header="Department" body={DepartmentTemplate} className="allocation-department"></Column>
                <Column header="Status" body={StatusTemplate} className="allocation-status"></Column>
                <Column header="Timeline" body={TimelineTemplate} className="allocation-timeline"></Column>
                <Column header="Tags" body={TagsTemplate} className="allocation-tags"></Column>
                <Column body={ThumbnailTemplate}></Column>
            </DataTable>
        </ScrollingPage>
    </> 
}