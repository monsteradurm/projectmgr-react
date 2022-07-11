import { useEffect, useState } from 'react';
import { Stack, Dropdown } from 'react-bootstrap';
import { Skeleton } from 'primereact/skeleton';
import { Avatar } from 'primereact/avatar';
import { formatTimeline } from '../../Helpers/Timeline.helper';

export const ReviewItem = ({status, review, activeTab}) => {
    const [timeline, setTimeline] = useState(null);
    const [primary, setPrimary] = useState('gray');
    useEffect(() => {
        setTimeline(formatTimeline(review.Timeline));    
    },[review])
    useEffect(() => {
        setPrimary(status.info.color);   
    },[review])
    return (
        <Stack direction="horizontal" gap={2}>
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
                            (12 comments, 2 drawings, 1 attachment)
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
                    <Skeleton width="130px" height="70px"></Skeleton>
                    <div style={{width:'100%', marginLeft: '10px',marginRight: '50px',
                        position: 'relative', height: '100%'}}>
                    
                        <Skeleton className="mb-2"></Skeleton>
                        <Skeleton className="mb-2"></Skeleton>
                        <Skeleton width="10rem" className="mb-2"></Skeleton>
                    </div>
                    
                </Stack>
            </Stack>
            <Avatar size="large" shape="circle" label="NA" 
            style={{position: 'absolute', top:'20px', right:'0px', background: status.info.color}}  />
        </Stack>
    )
}