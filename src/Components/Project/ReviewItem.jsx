import { useEffect, useState } from 'react';
import { Stack, Dropdown } from 'react-bootstrap';
import { Skeleton } from 'primereact/skeleton';
import { Avatar } from 'primereact/avatar';

export const ReviewItem = ({status, review}) => {

    return (
        <Stack direction="horizontal" gap={3} className="pm-review-item">
            <Skeleton width="100px" height="50px"></Skeleton>
            <div style={{width:'100%'}}>
                <Skeleton className="mb-3 mt-3"></Skeleton>
                <Skeleton className="mb-3"></Skeleton>
                <Skeleton width="10rem" className="mb-6"></Skeleton>
            </div>
            <Avatar size="large" shape="circle" label="NA" 
                    style={{background: status.info.color}}  />
        </Stack>
    )
}