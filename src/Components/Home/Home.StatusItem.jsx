import { SUSPENSE } from "@react-rxjs/core";
import { Skeleton } from "primereact/skeleton";
import React from "react";
import { Stack } from "react-bootstrap"
import { of } from "rxjs";
import { NavigationService } from "../../Services/Navigation.service";
import { LazyThumbnail } from "../General/LazyThumbnail";
import { Loading } from "../General/Loading";
import { useStatusReviewThumbnail, useStatusAssignedArtists, useStatusItem, useStatusReview, useStatusReviewComments, useStatusReviewLink, useStatusReviewName, useBoardItemFromStatusItem } from "./Home.context";
import "./Home.StatusItem.scss";

const onClickHandler = (e, url) => {
    if (!url)
        return;
    
    NavigationService.OpenNewTab(url, e);
}

const StatusThumbnail = ({Thumbnail, URL}) => {

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
}

export const HomeStatusItemSkeleton = ({statusItem, BoardItem}) => {
    return (<Stack direction="vertical" gap={2} className="pm-statusItem">
        <Stack direction="horizontal" gap={2} className="pm-statusItem-header" 
            style={{background: statusItem?.color}}>
            <div>{statusItem?.group_title},</div>
            <div>{BoardItem?.name?.split('/').join(', ')}</div>
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
}
export const HomeStatusItemContent = ({statusItem, BoardItem}) => {
    //const BoardItem = useStatusItem(statusItem?.id);
    const Review = useStatusReview(BoardItem);
    const ReviewName = useStatusReviewName(Review);
    const Link = useStatusReviewLink(Review);
    const Thumbnail = useStatusReviewThumbnail(Review);
    const Comments = useStatusReviewComments(Review);
    const Artists = useStatusAssignedArtists(BoardItem, Review);
    return (
        <Stack direction="vertical" gap={2} className="pm-statusItem">
            {
                BoardItem === SUSPENSE ?
                <Stack direction="horizontal" style={{width: '100%', height: '100%', justifyContent: 'center'}}>
                    <Loading text="Fetching Item..." /> 
                </Stack>:
                <>
               
                <Stack direction="horizontal" gap={2} className="pm-statusItem-header" 
                    style={{background: statusItem.color}}>
                    <div>{statusItem.group_title},</div>
                    <div>{BoardItem?.name.split('/').join(', ')}</div>
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
                                <div style={{fontSize: '13px', paddingLeft: 10}}>{
                                    Comments[0].text.length > 250 ? Comments[0].text.slice(0, 247) + '...' : Comments[0].text
                                }</div> : 
                                <div style={{fontWeight: 300, paddingLeft: 10,
                                    fontStyle: 'italic', fontSize: '14px'}}>No Comments...</div> :
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

            <div className="my-auto"></div>
            <Stack direction="horizontal" gap={2} style={{padding: '0px 30px 10px 30px'}}>
                <div className="mx-auto"></div>
                { 
                Artists?.length ? 
                    <div>{Artists.join(', ')}</div> 
                :   <div style={{fontWeight: 300, fontStyle: 'italic'}}>No Artist Assigned</div> 
                }
            </Stack>
            </>
        }
        </Stack>
    )
}
export const HomeStatusItem = React.memo(({statusItem, visible}) => {
    const BoardItem = useBoardItemFromStatusItem(statusItem);
    console.log(visible, statusItem.index);

    if (visible)
        return <HomeStatusItemContent statusItem={statusItem} BoardItem={BoardItem} />

        
    return (<HomeStatusItemSkeleton statusItem={statusItem} BoardItem={BoardItem}/>)
});