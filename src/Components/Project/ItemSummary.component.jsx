import { Skeleton } from "primereact/skeleton";
import { Fieldset } from "primereact/fieldset";
import { useContext, useEffect, useState } from "react";
import { ProjectItemContext } from "./ProjectItem.component";
import * as _ from 'underscore';
import moment from 'moment';
import { Stack } from "react-bootstrap";

export const ItemSummary = ({item}) => {
    const [reviewSummary, setReviewSummary] = useState(null);
    const [deliverySummary, setDeliverySummary] = useState(null);

    const itemContext = useContext(ProjectItemContext);

    const {Reviews} = itemContext.item;
    useEffect(() => {
        if (!Reviews)
            return;

        const reviewArr = Object.keys(Reviews)
        .filter(r => r.indexOf('All') < 0)
        .map(r => ({group: r, reviews: Reviews[r]}))

        if (reviewArr.length < 1) {
            setReviewSummary('Item has no reviews');
            setDeliverySummary('Item has had no deliveries');
            return;
        }
    
        setReviewSummary(reviewArr);

        const deliveryArr = reviewArr
        .map(r => ({group: r.group, 
            reviews: r.reviews
            .filter(review => review['Delivered Date']?.text?.length > 0)}
            ))
        .filter(r => r.reviews.length > 0)
        .map(r => ({group: r.group, delivered: moment(r.reviews[0]['Delivered Date'].text).format('MMM DD')}));

        setDeliverySummary(deliveryArr);

    }, [Reviews])

    useEffect(() => {
        console.log(reviewSummary, deliverySummary);
    }, [reviewSummary, deliverySummary])
    
    return (
            <div style={{width:'100%', padding: '40px', paddingTop: '10px', fontWeight: 400}}>
            <Stack direction="horizontal" gap={1} style={{justifyContent: 'end'}}>
                    {
                        !!reviewSummary && reviewSummary.length > 0 ?
                        reviewSummary.map(r =>
                        <span key={item.id + '_' + r.group + '-reviews'}>
                            <span style={{marginLeft: '10px'}}>
                                <span>
                                {r.reviews.length}
                                </span>
                                <span className="pm-summary-group" style={{marginLeft: '5px'}}>
                                    {r.group}
                                </span>
                            </span>
                        </span>)
                        : <span style={{fontStyle: 'italic'}}>
                            Item has had no reviews, 
                        </span>
                    }     
            </Stack>
            <Fieldset legend="Description">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                    cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </Fieldset>
            <Stack direction="horizontal" gap={1} style={{position:'absolute', bottom: 0, right: 40}}>
                    {
                        !!deliverySummary && deliverySummary.length > 0 ?
                        deliverySummary.map(r => 
                            <span key={item.id + '_' + r.group + '-delivery-summary'}>
                                <span>
                                    Last delivered
                                </span>
                                <span style={{marginLeft: '5px'}}>
                                    {r.delivered}
                                </span>
                                <span className="pm-summary-group" style={{marginLeft: '5px'}}>
                                    ({r.group.replace(' Reviews', '')}))
                                </span>
                            </span>)
                        : <span style={{fontStyle: 'italic'}}>
                            Item has had no deliveries
                            </span>
                    }
                </Stack>
        </div>)
}