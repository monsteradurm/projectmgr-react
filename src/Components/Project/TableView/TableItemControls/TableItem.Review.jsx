import { SUSPENSE } from "@react-rxjs/core";
import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { Stack } from "react-bootstrap";
import { BoardItemContext, useBoardItemName, useBoardItemStatus } from "../../Context/Project.Item.context";
import { useReviewArtists, useReviewDelivered, useReviewDepartment, useReviewIndex, useReviewItem, useReviewName, useReviewTags, useReviewTimeline } from "../../Context/Project.Review.context";
import { LatestThumbnail$, useSyncsketchComments, useSyncsketchItems, useSyncsketchReview, useSyncsketchThumbnail } from "../../Context/Project.Syncsketch.context";
import { CenteredSummaryContainer } from "./TableItem.SummaryContainer";
import { SummaryText } from "./TableItem.SummaryText";
import { NavigationService } from "../../../../Services/Navigation.service";
import { Skeleton } from "primereact/skeleton";
import { Button } from "primereact/button";
import { faArrowCircleLeft, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TableItemReviewComments } from "./TableItem.Review.Comments";
import * as _ from 'underscore';
import { TableItemReviewContextMenu } from "./TableItem.Review.ContextMenu";
import { AutoCloseReviewItemContext, ShowReviewContextMenu } from "./TableItem.Review.Context";
import moment from 'moment';

const NoItems = ({style}) => {
    const id = useId();
    const RowA = [
        {text: 'There are no Syncsketch Items uploaded yet for this Task...', id: id + '0'},
    ]

    return (
        <CenteredSummaryContainer style={style}>
            <SummaryText textArr={RowA} />
        </CenteredSummaryContainer>)
}

const ClickHandler = (e, url) => {
    console.log("URL", url);
    NavigationService.OpenNewTab(url);
}

const ReviewTags = ({Tags}) => {
    return (
    <Stack direction="horizontal" gap={2}>
    {
        Tags !== SUSPENSE && Tags?.length ?
        Tags?.map(t => <div key={t.id}>#{t.name}</div>) : null
    }
    </Stack>)
}

const ReviewArtists = ({Artists, Timeline}) => {
    const id = useId();
    
    const dates = Timeline?.text && Timeline?.text.indexOf(' - ') >= 0 ?
        Timeline.text.split(' - ') : null
    const style = {marginLeft: 5, marginTop:-20, fontSize: 13, color: 'gray'};
    if ([Artists, Timeline].indexOf(SUSPENSE) >= 0)
        return <></>
    return (
    <>
        {
            Artists && Artists.length > 0 && <div style={style}>{Artists?.join(', ')}</div>
        }
        {
            dates &&
            <div style={style}>({moment(dates[0]).format('MMM DD, YYYY') + ' - ' + 
                moment(dates[1]).format('MMM DD, YYYY') })</div>
        }
        
    </>
    )
}
const ReviewThumbnail = ({Thumbnail, URL}) => {
    return (<div style={{height: 100}}>
        {
            Thumbnail && Thumbnail !== SUSPENSE ?
            <img src={Thumbnail} className="pm-thumbnail-link"
            onClick={(e) => ClickHandler(e, URL)}
            style={{width: 160, height:90, cursor: 'pointer', objectFit: 'cover', borderRadius:5,
            border: 'solid 2px black'}} /> 
            : <Skeleton width={160} height={90}/>
        }
        </div>)
}
const ReviewTitle = ({Title, Uploads}) => {
    if (Title)
        return (
        <Stack direction="horizontal" gap={2}>
            <div style={{fontWeight: 'bold'}}>{Title}</div>        
        {
            Uploads > 1 ?
            <div> ({Uploads} Uploads) </div> : null
        }
        </Stack>)

    return <Skeleton width={300} />
}
const SyncReviewSummary = ({Comments}) => {
    const [AttachmentCount, SetAttachmentCount] = useState(0)
    const [CommentCount, SetCommentCount] = useState(0);
    const [SketchCount, SetSketchCount] = useState(0);

    useEffect(() => {
        if (!Comments || Comments === SUSPENSE)
            return;
        if (Comments.length > 0) {
            SetCommentCount(_.filter(Comments, r => r.type === 'comment').length)
            SetAttachmentCount(_.flatten(Comments.map(c => c.attachments)).length)
            SetSketchCount(_.filter(Comments, r => r.type === 'sketch').length)
        }
    }, [Comments])

    if (!Comments || Comments == SUSPENSE || CommentCount < 1)
        return <></>

    return (
        <Stack direction="horizontal" gap={2} style={{paddingLeft: 10, fontWeight: 600, fontSize: 14}}>
            <div>{CommentCount} Comments</div>
            { 
                AttachmentCount > 0 ?
                <div>{AttachmentCount} Attachments,</div> : null
            }
            { 
                SketchCount > 0 ?
                <div>{SketchCount} Drawings,</div> : null
            }
        </Stack>
    )
}

const ReviewDelivered = ({Delivered, primary}) => {
    const style = {marginLeft: 0, marginTop: -10, width: 160, textAlign: 'center',
    fontSize: 12}
    if (!Delivered)
        return (<></>)
    
    return (<div style={{...style, color: 'black' }}>Delivered: {Delivered}</div>) 
}

export const TableItemReview = ({ReviewId, ActiveDepartment, primary}) => {
    const { BoardItemId, CurrentReviewId, Status, Element, Task, Department } = useContext(BoardItemContext);
    const ReviewDepartment = useReviewDepartment(ReviewId);
    const SyncsketchReview = useSyncsketchReview(Element, ReviewDepartment);
    const Name = useReviewName(ReviewId);
    const Index = useReviewIndex(ReviewId);
    const ReviewItems = useSyncsketchItems(SyncsketchReview?.uuid, Department, Index);
    const [CurrentItemIndex, SetCurrentItemIndex] = useState(0);
    const [CurrentReview, SetCurrentReview] = useState(SUSPENSE);
    const Thumbnail = useSyncsketchThumbnail(CurrentReview?.id);
    const Comments = useSyncsketchComments(CurrentReview?.id);
    const Delivered = useReviewDelivered(ReviewId);
    const Tags = useReviewTags(ReviewId);
    const ReviewContextMenuRef = useRef();
    const AutoCloseReview = AutoCloseReviewItemContext();
    const Artists = useReviewArtists(ReviewId);
    const Timeline = useReviewTimeline(ReviewId);
    const reviewContainerStyle = useMemo(() => {
        const color = CurrentReviewId === ReviewId ? 
            Status.color : '#BBB';
        return { 
            borderRightColor: color, 
            borderLeftColor: color, 
            position: 'relative'
        }

    },[Status, CurrentReviewId, ReviewId, ReviewDepartment]);

    useEffect(() => {
        if (ReviewItems === SUSPENSE && CurrentReview !== SUSPENSE) {
            SetCurrentReview(SUSPENSE);
            return;
        }
        else if ((!ReviewItems || ReviewItems.length < 1) && CurrentReview !== null) {
            SetCurrentReview(null);
            return;
        } else if (ReviewItems?.length > 0) {
            if (CurrentItemIndex >= ReviewItems.length) {
                SetCurrentItemIndex(ReviewItems.length - 1)
                return;
            }
            if (CurrentReview === null || 
                JSON.stringify(CurrentReview) !== JSON.stringify(ReviewItems[CurrentItemIndex])) {
                const review = ReviewItems[CurrentItemIndex];
                SetCurrentReview(review);
            }
        }
    }, [ReviewItems, CurrentItemIndex])

    return (
        <Stack direction="vertical" gap={1} style={reviewContainerStyle} className="pm-review-container"
        onContextMenu={(evt) => ShowReviewContextMenu(evt,CurrentReviewId, ReviewContextMenuRef)}>
            <TableItemReviewContextMenu CurrentReviewId={ReviewId} ReviewItems={ReviewItems} 
                Artists={Artists} BoardItemId={BoardItemId}
                Delivered={Delivered} CurrentItemIndex={CurrentItemIndex} ContextMenuRef={ReviewContextMenuRef}/>
             {
                // arrow for previous item, if index > 0
                ReviewItems?.length > 1 && CurrentItemIndex > 0 ?
                <FontAwesomeIcon icon={faChevronLeft} className="pm-review-step previous" 
                    onClick={() => SetCurrentItemIndex(CurrentItemIndex - 1)}
                    style={{color: primary}}/> : null
            }
            <Stack direction="horizontal" style={{padding: '5px 20px 0px 20px'}}>
                <ReviewTitle Title={CurrentReview?.name} Uploads={ReviewItems?.length} primary={primary}/>
                <div className="mx-auto"></div>
                <ReviewTags Tags={Tags} />
            </Stack>
            <Stack direction="horizontal" gap={2} style={{padding: '0px 20px'}}>
                <ReviewThumbnail Thumbnail={Thumbnail} URL={CurrentReview?.url} />
                <Stack direction="vertical">
                    <SyncReviewSummary Comments={Comments} />
                    <TableItemReviewComments ItemId={CurrentReview?.id} Comments={Comments}/>
                </Stack>
            </Stack>
            <Stack direction="horizontal" gap={1} style={{padding: '0px 20px'}}>
                <ReviewDelivered Delivered={Delivered} primary={primary}/>
                <div className="mx-auto"></div>
                <ReviewArtists Artists={Artists} Timeline={Timeline}/>
            </Stack>
            {
                // arrow for next item, if there are more above current index
                ReviewItems?.length > 1 && CurrentItemIndex < ReviewItems.length - 1?
                <FontAwesomeIcon icon={faChevronRight} className="pm-review-step next" 
                    style={{color: primary}} onClick={() => SetCurrentItemIndex(CurrentItemIndex + 1)}/> : null
            }
        </Stack>
    )
}