import { Skeleton } from "primereact/skeleton";
import { Fieldset } from "primereact/fieldset";
import { useContext, useEffect, useState } from "react";
import { ProjectItemContext } from "./ProjectItem.component";
import * as _ from 'underscore';
import moment from 'moment';
import { Stack } from "react-bootstrap";

export const ItemSummary = () => {
    const [reviewSummary, setReviewSummary] = useState(null);
    const [deliverySummary, setDeliverySummary] = useState(null);

    const itemContext = useContext(ProjectItemContext);

    const {Item, Reviews} = itemContext.item;
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

    return (<div style={{width:'100%', padding: '40px', paddingTop: '10px', fontWeight: 400}}>
            <Stack direction="horizontal" gap={1} style={{justifyContent: 'end'}}>
                <div key="review-summary" id="reivew-summary">
                    {
                        reviewSummary && reviewSummary.length > 0 ?
                        reviewSummary.map(r =>
                        <span key={r.group + '-reviews'} style={{marginLeft: '10px'}}>
                            <span key={r.group + '_reviews-length'}>
                            {r.reviews.length}
                            </span>
                            <span  key={r.group + '_reviews-group'} 
                                className="pm-summary-group" style={{marginLeft: '5px'}}>
                                {r.group}
                            </span>
                        </span>)
                        : <span key="no-reviews" style={{fontStyle: 'italic'}}>
                            Item has had no reviews, </span>
                    }
                </div>

                
            </Stack>
            <Fieldset legend="Description">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                    cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </Fieldset>
            <div key="delivery-summary" id="delivery-summary" style={{marginLeft: '15px'}}>
                    {
                        deliverySummary && deliverySummary.length > 0 ?
                        deliverySummary.map(r => 
                            <>
                                <span key={r.group + 'deliveries-last'}>
                                    Last delivered
                                </span>
                                <span style={{marginLeft: '5px'}} key={r.group + 'deliveries-date'}>
                                    {r.delivered}
                                </span>
                                <span key={r.group + 'deliveries-group'} 
                                    className="pm-summary-group" style={{marginLeft: '5px'}}>
                                    ({r.group.replace(' Reviews', '')}))
                                </span>
                            </>)
                        : <span key="no deliveries" style={{fontStyle: 'italic'}}>
                            Item has had no deliveries
                            </span>
                    }
                </div>
        </div>)
}