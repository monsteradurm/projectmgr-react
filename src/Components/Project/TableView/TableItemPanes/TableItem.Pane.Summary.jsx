import { SUSPENSE } from "@react-rxjs/core";
import { useContext } from "react";
import { Stack } from "react-bootstrap";
import { BoardItemContext, useBoardItemDescription, useBoardItemDirectors, useLastDelivered, useReviewCount } from "../../Context/Project.Item.context";
import parse from 'html-react-parser'
import { Loading } from "../../../General/Loading";

export const TableItemSummary = ({visible}) => {
    const { BoardItemId, CurrentReviewId, Status } = useContext(BoardItemContext);
    const ReviewCount = useReviewCount(BoardItemId);
    const Description = useBoardItemDescription(BoardItemId);
    const Directors =  useBoardItemDirectors(BoardItemId)
    const LastDelivered = useLastDelivered(BoardItemId);
    
    if ([BoardItemId, Status, ReviewCount, Directors, Description, LastDelivered].indexOf(SUSPENSE) >= 0)
        return <Loading text="Retrieving Item Summary..." />

    if (!visible)
        return <></>;

    return (
        <Stack direction="vertical" gap={1} style={{padding: '10px 30px', height: '100%'}}>
            <Stack direction="horizontal" gap={2}>
                <div style={{fontWeight: 600}}>
                    Desription
                </div>
                <div className="mx-auto"></div>
                {
                    ReviewCount.map(([department, count]) => <div key={"ReviewCount_" + department}>
                        {count} {department}</div>)
                }
                {
                    ReviewCount?.length > 0 ?
                    <div>Reviews</div> : null
                }
            </Stack>
            <div style={{fontSize: 14, marginTop: Description ? 5 : 0}}>
                {
                    Description ? parse(Description) : 
                    <div style={{fontStyle: 'italic'}}>No Description provided</div>
                }
            </div>
            <div className="my-auto"></div>
            <Stack direction="horizontal" gap={2}>
            {
                Directors?.length > 0 ?
                <Stack direction="horizontal" gap={2} style={{fontWeight: 600, marginTop: 10}}>
                    <div>Directed By</div>
                    {
                        Directors.map(d => <div key={BoardItemId + "_DirectedBy" + d}>{d}</div>)
                    }
                </Stack> : 
                <div style={{fontStyle: 'italic'}}>No Directors are associated with this task.</div>
            }
            
            <div className="mx-auto"></div>
            {
                LastDelivered ?
                <Stack direction="horizontal" gap={2} style={{fontWeight: 400, marginTop: 10}}>
                    <div>Last Delivered:</div>
                    <div>{LastDelivered}</div>
                </Stack> :
                <div style={{fontStyle: 'italic', marginTop: 10}}>No Deliveries are associated with this task.</div>
            }
            </Stack>
        </Stack>
    )
}