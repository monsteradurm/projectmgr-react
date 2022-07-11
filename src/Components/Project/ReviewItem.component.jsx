import { useEffect, useRef, useState } from 'react';
import { Stack, Dropdown } from 'react-bootstrap';
import { Skeleton } from 'primereact/skeleton';
import { Avatar } from 'primereact/avatar';
import { formatTimeline } from '../../Helpers/Timeline.helper';
import { NavigationService } from '../../Services/Navigation.service';
import * as _ from 'underscore';
import { SyncsketchService } from '../../Services/Syncsketch.service';
import { ContextMenu } from 'primereact/contextmenu';

export const ReviewItem = ({status, review, activeTab}) => {
    const [timeline, setTimeline] = useState(null);
    const [primary, setPrimary] = useState('gray');
    const [thumbnail, setThumbnail] = useState(null);
    const [reviewLink, setReviewLink] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [hovering, setHovering] = useState(false);
    const itemContext = useRef();

    const contextMenu = [
        {label: "Edit Review"},
        {separator: true},
        {label: "Remove Review"}
    ]
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
                fb.comment = _.last(comments).text;

                if (fb.comment.length > 450)
                    fb.comment = fb.comment.substring(0, 450) + '...'
                setFeedback(fb);
            }
        )
        //setFeedback()
    }, [reviewLink])
    useEffect(() => {
        setTimeline(formatTimeline(review.Timeline));   
        setPrimary(status.info.color);  

        if (review?.Link?.text && review.Link.text.length > 0) {
            setReviewLink(review.Link.text);
            const id = _.first(
                _.last(review.Link.text.split('/#/')).split('/')
            )
            SyncsketchService.ItemById$(id).subscribe(result => {
                if (result.thumbnail_url)
                    setThumbnail(result.thumbnail_url)
            });
        }
            
        else if (reviewLink !== null)
            setReviewLink(null);

    },[review])

    return (
    <>
        <ContextMenu model={contextMenu} ref={itemContext} className="pm-task-context"></ContextMenu>
        <Stack direction="horizontal" gap={2} 
            onContextMenu={(e) => itemContext.current.show(e)}
            onMouseEnter={(evt) => setHovering(true)} onMouseLeave={(evt) => setHovering(false)}
            className={hovering ? "pm-review-hover" : null}>
            <Stack direction="vertical" gap={2} className="pm-review-item">
                <Stack direction="horizontal" gap={3}>
                    <div style={{maxWidth:'130px', width: '100%'}}>
                        <div className="pm-review-title" style={{textAlign:'center', width: '100%'}}>
                            {review['Feedback Department'].text + ' #' + review.index}
                        </div>
                    </div>
                    <Stack direction="horizontal" 
                        style={{width:'100%', position: 'relative'}}>
                        <div className="pm-review-title">
                            {review.name}
                        </div>

                        <div className="pm-review-title" 
                            style={{marginLeft:'15px', fontWeight:400}}>
                            {
                                feedback ?
                                `(${feedback.comment_count} comments, ` +
                                `${feedback.sketch_count} sketches, ` +
                                `${feedback.attachment_count} attachments)`
                                 : null
                            }
                        </div>
                        
                        <div className="pm-review-timeline" 
                            style={{marginLeft: '10px', marginRight:'50px',
                            fontWeight: 400}}>
                            {
                                timeline
                            }
                        </div>
                    </Stack>
                </Stack>
                <Stack direction="horizontal" gap={3}> 
                    {   
                        thumbnail ?
                        <img src={thumbnail} className="pm-review-thumbnail" 
                        onClick={(e) => NavigationService.OpenNewTab(reviewLink, e)}/> :
                        <Skeleton width="130px" height="70px"></Skeleton>
                    }
                    <div style={{width:'100%', marginLeft: '10px',marginRight: '50px',
                        position: 'relative', height: '100%'}} className="pm-comment">
                    {
                        feedback ?
                        feedback.comment : null
                    }
                    </div>
                    
                </Stack>
            </Stack>
            <Avatar size="large" shape="circle" label="NA" 
            style={{position: 'absolute', top:'20px', right:'0px', background: status.info.color}}  />
        </Stack>
    </>
    )
}