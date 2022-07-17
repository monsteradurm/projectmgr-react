import { Skeleton } from "primereact/skeleton";
import { Fieldset } from "primereact/fieldset";
import { useContext, useEffect, useState } from "react";
import { ProjectItemContext } from "./ProjectItem.component";
import * as _ from 'underscore';
import moment from 'moment';
import { Stack } from "react-bootstrap";
import { MondayService } from "@Services/Monday.service";
import parse from 'html-react-parser'
import { Loading } from "@Components//General/Loading";

export const ItemSummary = ({item}) => {
    const [reviewSummary, setReviewSummary] = useState(null);
    const [deliverySummary, setDeliverySummary] = useState(null);
    const [description, setDescription] = useState(null);
    const [fetching, setFetching] = useState(true);
    const itemContext = useContext(ProjectItemContext);

    const {Reviews, Director} = itemContext.item;
    useEffect(() => {
        if (!item) return;

        MondayService.ItemUpdates(item.id).subscribe((d) => {
            console.log("desc", d);
            setFetching(false);
            setDescription(d);
        })
    }, [item])
    useEffect(() => {
        if (!Reviews)
            return;

        const reviewArr = Object.keys(Reviews)
        .filter(r => r.indexOf('All') < 0)
        .map(r => ({group: r, reviews: Reviews[r]}))
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
    
    return (
            fetching ? <Loading text="Fetching Summary from Monday" /> :
            <div style={{width:'100%', padding: '40px', paddingTop: '10px', fontWeight: 400}}>
            <Stack direction="horizontal" gap={1} style={{justifyContent: 'end'}}>
                    {
                        reviewSummary !== null && reviewSummary.length > 0 ?
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
                {description ?  parse(description) : <p style={{fontStyle: 'italic'}}>No Description Written...</p>}
            </Fieldset>
            <Stack direction="horizontal" gap={1}>
                {
                    Director && Director.length > 0 ? 
                    <>
                        <div>Directed by</div>
                        { Director.map(d => <div key={d} className="pm-comma-list">{d}</div>) }
                    </>
                    : <div style={{fontStyle: 'Italic'}}>No Directors Listed..</div>
                }
            </Stack>
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