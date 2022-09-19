import { SUSPENSE } from "@react-rxjs/core";
import { Skeleton } from "primereact/skeleton";
import { Stack } from "react-bootstrap"
import { of } from "rxjs";
import { LazyThumbnail } from "../General/LazyThumbnail";
import { Loading } from "../General/Loading";
import { useStatusReviewThumbnail, useStatusAssignedArtists, useStatusItem, useStatusReview, useStatusReviewComments, useStatusReviewLink, useStatusReviewName } from "./Home.context";
import "./Home.StatusItem.scss";

const StatusThumbnail = ({Thumbnail, URL}) => {
    return (<div style={{height: 100}}>
        {
            Thumbnail && Thumbnail !== SUSPENSE ?
            <img src={Thumbnail} className="pm-thumbnail-link"
            onClick={(e) => ClickHandler(e, URL)}
            style={{width: 160, height:120, cursor: 'pointer', objectFit: 'cover', borderRadius:5}} /> 
            : <Skeleton width={160} height={120}/>
        }
        </div>)
}

export const HomeStatusItem = ({statusItem}) => {
    const BoardItem = useStatusItem(statusItem?.id);
    const ReviewName = useStatusReviewName(statusItem?.id);
    const Review = useStatusReview(statusItem?.id);
    const Link = useStatusReviewLink(statusItem?.id);
    const Thumbnail = useStatusReviewThumbnail(statusItem?.id);
    const Comments = useStatusReviewComments(statusItem?.id);
    const Artists = useStatusAssignedArtists(statusItem?.id);

    return (
        <Stack direction="vertical" gap={2} className="pm-statusItem">
            {
                BoardItem === SUSPENSE ?
                <Loading text="Fetching Item..." /> :
                <>
               
                <Stack direction="horizontal" gap={2} className="pm-statusItem-header" 
                    style={{background: statusItem.color}}>
                    <div>{statusItem.group_title},</div>
                    <div>{BoardItem?.name.split('/').join(', ')}</div>
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
                    {
                    Thumbnail ?
                        <StatusThumbnail Thumbnail={Thumbnail} URL={Link} />
                        : <div>No Thumbnail</div>
                    }
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
                </Stack> : null
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