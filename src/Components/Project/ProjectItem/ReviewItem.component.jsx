import { useContext, useEffect, useRef, useState } from 'react';
import { Stack, Dropdown, Container } from 'react-bootstrap';
import { Avatar } from 'primereact/avatar';
import { formatTimeline } from '@Helpers/Timeline.helper';
import * as _ from 'underscore';
import { SyncsketchService } from '@Services/Syncsketch.service';
import { ContextMenu } from 'primereact/contextmenu';
import { Tooltip } from 'primereact/tooltip';
import moment from 'moment';
import { toggleArrFilter } from '@Components/Project/Overview.filters';
import { delay, map, of, take, tap } from 'rxjs';
import { ApplicationContext } from '@/Application.component';
import * as UserService from "@Services/User.service";
import { Loading } from '@Components/General/Loading';
import { LazyThumbnail } from '@Components/General/LazyThumbnail';
import { useAllUsers } from '../../../Application.context';

export const ReviewItem = ({status, review, activeTab, currentReview,
    tagOptions, searchParams, setSearchParams}) => {
    const [timeline, setTimeline] = useState(null);
    const [delivered, setDelivered] = useState(null);
    const [tags, setTags] = useState(null);
    const [primary, setPrimary] = useState('#aaa');
    const [artist, setArtist] = useState(null);
    const [initials, setInitials] = useState(null);
    const [thumbnail$, setThumbnail$] = useState(null);
    const [reviewLink, setReviewLink] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [photo, setPhoto] = useState(null);
    const[fetching, setFetching] = useState(true)
    const itemContext = useRef();
    
    const AllUsers = useAllUsers();

    const contextMenu = [
        {label: "Edit Review"},
        
        {separator: true},
        {label: "Remove Review"},
        {separator: true},
        {label: "Copy To..."},
    ]

    
    useEffect(() => {
        if (!AllUsers || !artist)
            return;
        const key = artist.toLowerCase();
        const user = AllUsers[key];

        if (!user) return;

        const photo$ = UserService.UserPhoto$(user.graph.id);
        photo$.pipe(take(1)).subscribe((result) => {
            setPhoto(result);
        })
    }, [AllUsers, artist])

    useEffect(() => {
        if (!reviewLink)
            return;

        const itemId = _.first(
            _.last(reviewLink.split('/#/')).split('/')
        )
        
        SyncsketchService.AllFeedback$(itemId).subscribe(
            (result) => {
                const comments = _.filter(result, r => r.type === 'comment' && r.text.length > 0)
                const sketches = _.filter(result, r => r.type === 'sketch');
                const fb = {};
                fb.attachment_count = _.reduce(result, (acc, r) => {
                    if (r.attachments)
                        acc = acc + r.attachments.length;
                    return acc;
                }, 0);
                fb.comment_count = comments.length;
                fb.sketch_count = sketches.length;
                const last = _.last(comments);

                if (last) {
                    fb.modified = moment(last.modified).format('MMM DD');
                    fb.user = last.creator.full_name;
                    fb.comment = last.text;
                }

                if (fb?.comment?.length > 350)
                    fb.comment = fb.comment.substring(0, 350) + '... '

                
                setFeedback(fb);
            }
        )
        //setFeedback()
    }, [reviewLink])
    useEffect(() => {
        setTimeline(formatTimeline(review.Timeline));   
        setPrimary(review?.id == currentReview?.id ? 
            status.info.color : '#aaa');  
        
        if(review && review['Delivered Date'] && review['Delivered Date']?.text?.length > 0) {
            setDelivered(moment(review['Delivered Date'].text).format('MMM DD'));
        }
        else if (delivered != null)
            setDelivered(null);

        if (review?.Link?.text && review.Link.text.length > 0) {
            setReviewLink(review.Link.text);
            const id = _.first(
                _.last(review.Link.text.split('/#/')).split('/')
            )

            SyncsketchService.ItemById$(id).pipe(take(1)).subscribe(result => {
                setFetching(false)
                setThumbnail$(of(result.thumbnail_url));
                const name = result.creator.full_name;
                setInitials(name.split(' ').map(n => n[0]).join(''))
                setArtist(name);
            })
        }
            
        else if (reviewLink !== null)
            setReviewLink(null);

        let tags = review.Tags?.value ?
        review.Tags.value.reduce((acc, t) => {
            if (tagOptions[t]) {
                acc.push(t)
            }
            return acc;
        }, []) : [];

        setTags(tags);
    },[review, currentReview])

    const onTagClick = (evt, t) => {
        evt.stopPropagation();
        toggleArrFilter(t, 'Tags', searchParams, setSearchParams);
    }

    return (
    <>
        <ContextMenu model={contextMenu} ref={itemContext} className="pm-task-context"></ContextMenu>
        <Stack direction="horizontal" gap={2}
            onContextMenu={(e) => itemContext.current.show(e)} 
            style={{ borderRightColor: primary, borderLeftColor: primary, position: 'relative'}}
            className="pm-review-container">
            <Stack direction="vertical" className="pm-review-item">
            { 
                fetching ?
                        <Loading text="Fetching Review from Syncsketch" size={60} /> : 
                <>
                    <Stack direction="horizontal" gap={3}>
                        <div style={{maxWidth:'130px', width: '100%'}}>
                            <div className="pm-review-title" style={{textAlign:'center', width: '100%'}}>
                                {review['Feedback Department'].text + ' #' + review.index}
                            </div>
                        </div>
                        
                        <Stack direction="horizontal" gap={3}
                            style={{width:'100%', position: 'relative'}}>
                            <div className="pm-review-title">
                                {review.name}
                                
                                <span style={{marginLeft:'10px', fontWeight: 400}}>
                                {
                                    feedback ?
                                    `${feedback.comment_count} comments, ` +
                                    `${feedback.sketch_count} sketches, ` +
                                    `${feedback.attachment_count} attachments`
                                    : null
                                }
                                </span>
                                
                                

                            </div>
                            <div className="ms-auto"></div>
                            <div className="pm-task-tags" style={{marginRight: '50px'}}>
                                <Stack direction="horizontal" gap={1} className="pm-tag-row">
                                {   
                                    tags && tags.length > 0 ?
                                    tags.map((t) => 
                                    <div className="pm-tag" key={tagOptions[t].id} 
                                        style={{color: primary}}
                                        onClick={(evt) => onTagClick(evt, t)}>
                                        {'#' + t}
                                    </div>) : null
                                }
                                </Stack>
                            </div>                   
                        </Stack>
                    </Stack>   
                    <Stack direction="horizontal" gap={3} style={{position:'relative'}}> 
                        <LazyThumbnail thumbnail$={thumbnail$} url={reviewLink} width={130} height={70} 
                            borderRadius={5} border="solid 2px black"
                        />
                        <div style={{width:'100%', marginLeft: '10px',marginRight: '50px',
                            fontStyle: feedback?.comment ? null : 'italic',
                            position: 'relative', height: '100%'}} className="pm-comment">
                                {
                                    feedback ?
                                    ( feedback.comment ? feedback.comment : 'No Feedback has been written for this review...' ) 
                                    : null
                                }
                                <span style={{fontStyle: 'italic', color: 'gray'}}>
                                {
                                    
                                    feedback?.modified ? ` - ${feedback.user}, ${feedback.modified}` : null
                                }
                                </span>
                        </div>
                        
                    </Stack>
                    <Stack direction="horizontal" gap={3}>
                        <div className="pm-review-timeline" style={{maxWidth:'130px', width: '100%'}}>
                            {
                                timeline ? timeline : 'No Timeline'
                            }
                        </div>
                        {
                            delivered ?
                            <div className="pm-review-delivered">
                                Delivered {delivered}
                            </div> : null
                        }
                    </Stack>
                </>
            }
            </Stack>
                <Tooltip target=".pm-review-avatar" position="top" className="pm-tooltip" mouseTrack={false}
                mouseTrackTop={10}/>
                {
                fetching ? null : 
                    photo ? 
                    <Avatar data-pr-tooltip={artist} data-pr-position="top"
                        className="pm-review-avatar pm-avatar-review-image"
                        image={photo}
                        key={artist}  size="large" shape="circle"
                        style={{position: 'absolute', top:'20px', right:'20px',
                        opacity: primary === '#aaa' ? 0.5 : 1}}
                        /> :
                    <Avatar className="pm-review-avatar" size="large" shape="circle" 
                        label={artist ? initials : '?'} 
                        data-pr-tooltip={artist ? artist : 'Not Specified'} data-pr-position="top"
                        style={{position: 'absolute', top:'20px', right:'20px', background: primary}}  />
                }
        </Stack>
    </>
    )
}