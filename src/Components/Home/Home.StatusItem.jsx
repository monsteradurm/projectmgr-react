import { SUSPENSE } from "@react-rxjs/core";
import { ContextMenu } from "primereact";
import { Skeleton } from "primereact/skeleton";
import React, { useEffect, useRef, useState } from "react";
import { Stack } from "react-bootstrap"
import { of } from "rxjs";
import { NavigationService } from "../../Services/Navigation.service";
import { LazyThumbnail } from "../General/LazyThumbnail";
import { Loading } from "../General/Loading";
import { useStatusReviewThumbnail, useStatusAssignedArtists, useStatusItem, useHomeSearchFilter,
    useStatusReview, useStatusReviewComments, useStatusReviewLink, useStatusReviewName, useBoardItemFromStatusItem, useStatusContextMenu } from "./Home.context";
import { StatusItemArtists } from "./Home.StatusItem.Artists";
import "./Home.StatusItem.scss";

const onClickHandler = (e, url) => {
    if (!url)
        return;
    
    NavigationService.OpenNewTab(url, e);
}

const StatusThumbnail = React.memo(({Thumbnail, URL}) => {

    return (<div style={{height: 100}}>
        {
            Thumbnail && Thumbnail !== SUSPENSE ?
            <img src={Thumbnail} className="pm-thumbnail-link"
            onClick={(e) => onClickHandler(e, URL)}
            style={{width: 160, height:120, cursor: 'pointer', border: 'solid 1px black',
            objectFit: 'cover', borderRadius:5}} /> 
            : <Skeleton width={160} height={120}/>
        }
        </div>)
})

export const HomeStatusItemSkeleton = React.memo(({statusItem, BoardItem, StatusContextMenu}) => {
    const Review = useStatusReview(BoardItem)
    const ReviewName = useStatusReviewName(statusItem?.Review);
    const StatusContextMenuRef = useRef();
    return (<Stack direction="vertical" gap={2} className="pm-statusItem" onContextMenu={
        (e) => StatusContextMenuRef?.current?.show(e) 
    }>
        <ContextMenu model={StatusContextMenu} 
                ref={StatusContextMenuRef} className="pm-status-context"></ContextMenu>
        <Stack direction="horizontal" gap={2} className="pm-statusItem-header" 
            style={{background: statusItem?.color}}>
            <div>{statusItem?.group_title},</div>
            <div>{statusItem?.item_name?.split('/').join(', ')}</div>
            <div className="mx-auto"></div>
            <div>{statusItem?.board_name?.split('/').join(', ')}</div>
        </Stack>
        <Stack direction="horizontal" gap={2}  className="pm-statusItem-reviewTitle" style={{paddingTop:10}}>
            <Skeleton width="80%" height="30px" />
        </Stack>
        <Stack direction="horizontal" gap={2} style={{padding: '0px 30px'}}>
            <Skeleton width={160} height={120}/>
            <Stack direction="vertical" gap={2} style={{paddingLeft: 10}}>
                <Skeleton width="100%" />
                <Skeleton width="100%" />
                <Skeleton width="100%" />
                <Skeleton width="50%" />
            </Stack>
        </Stack>
    </Stack>)
})

export const HomeStatusItemContent = React.memo(({statusItem, BoardItem, StatusContextMenu}) => {
    const Review = useStatusReview(BoardItem);
    const ReviewName = useStatusReviewName(Review);
    const Link = useStatusReviewLink(Review);
    const Thumbnail = useStatusReviewThumbnail(Review);
    const Comments = useStatusReviewComments(Review);
    const StatusContextMenuRef = useRef();
    return (
        <>
        {
            statusItem?.artists?.length > 0 ?
            <StatusItemArtists artists={statusItem?.artists} statusId={statusItem?.id} searchKey="Users"
            color={statusItem.color} align="left"/> :
            <div style={{width: 300}} ></div>
        }
        
        <Stack direction="vertical" gap={2} className="pm-statusItem" onContextMenu={
            (e) => StatusContextMenuRef?.current?.show(e) 
        }>
            <ContextMenu model={StatusContextMenu} 
                ref={StatusContextMenuRef} className="pm-status-context"></ContextMenu>
            {
                statusItem?.BoardItem === SUSPENSE ?
                <Stack direction="horizontal" style={{width: '100%', height: '100%', justifyContent: 'center'}}>
                    <Loading text="Fetching Item..." /> 
                </Stack>:
                <>
               
                <Stack direction="horizontal" gap={2} className="pm-statusItem-header" 
                    style={{background: statusItem.color}}>
                    <div>{statusItem.group_title},</div>
                    <div>{statusItem?.item_name?.split('/').join(', ')}</div>
                    {
                        statusItem?.department  &&
                        <span style={{marginLeft: 10}}>({statusItem.department})</span>
                    }
                    <div className="mx-auto"></div>
                    <div>{statusItem.board_name.split('/').join(', ')}</div>
                </Stack>
                <Stack direction="horizontal" gap={2}  className="pm-statusItem-reviewTitle">
                {
                ReviewName ?
                    <div>{ReviewName}</div>
                    : <div style={{fontStyle: 'italic', fontWeight: 400}}>No Reviews have been uploaded for this task.</div>
                }
                </Stack>
            {
                Link ? 
                <Stack direction="horizontal" gap={2} style={{padding: '0px 30px'}}>
                    <StatusThumbnail Thumbnail={Thumbnail} URL={Link} />
                    {
                        Comments !== SUSPENSE ? 
                            Comments?.length?
                                <div style={{fontSize: '16px', paddingLeft: 10, textAlign: 'left'}}>{
                                    Comments[0].text.length > 550 ? Comments[0].text.slice(0, 547) + '...' : Comments[0].text
                                }</div> : 
                                <div style={{fontWeight: 300, paddingLeft: 10,
                                    fontStyle: 'italic', fontSize: '16px'}}>No Comments...</div> :
                            <Stack direction="vertical" gap={2} style={{paddingLeft: 10}}>
                                <Skeleton width="100%" />
                                <Skeleton width="100%" />
                                <Skeleton width="100%" />
                                <Skeleton width="50%" />
                            </Stack>
                    }
                </Stack> : 
                <Stack direction="horizontal" gap={2} style={{padding: '0px 30px'}}>
                    <Skeleton width={160} height={120}/>
                    <div style={{marginLeft: 20}}>There is no 
                        <span style={{fontWeight: 600, marginLeft: 5, marginRight: 5, fontSize: 18}}>Syncsketch Item</span> 
                        associated with this task</div>
                </Stack>
            }
            </>
        }
        </Stack>
        {
            statusItem?.directors?.length > 0 ?
            <StatusItemArtists artists={statusItem?.directors} align="right" searchKey="Users"
            statusId={statusItem?.id + "_directors"} color={statusItem.color}/> :
            <div style={{width: 300}}></div>
        }
        </>
    )
})

export const HomeStatusItem = React.memo(({statusItem, maxIndex}) => {
    const [visible, setVisible] = useState(false);
    const BoardItem = useBoardItemFromStatusItem(statusItem);
    const Review = useStatusReview(BoardItem);
    const StatusContextMenu = useStatusContextMenu(statusItem);

    useEffect(() => {
        if (statusItem.index < maxIndex && !visible)
            setVisible(true);
        
    }, [maxIndex, statusItem]);

    if (visible)
        return <HomeStatusItemContent statusItem={statusItem} BoardItem={BoardItem} StatusContextMenu={StatusContextMenu} />
        
    return (<HomeStatusItemSkeleton statusItem={statusItem} BoardItem={BoardItem} StatusContextMenu={StatusContextMenu}/>)
});