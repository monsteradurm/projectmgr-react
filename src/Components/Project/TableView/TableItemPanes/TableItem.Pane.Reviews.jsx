import { SUSPENSE } from "@react-rxjs/core";
import { useContext, useId } from "react"
import { Stack } from "react-bootstrap";
import { BoardItemContext, useBoardItemStatus } from "../../Context/Project.Item.context";
import { useGroup } from "../../Context/Project.Objects.context";
import { useDepartmentReviews, useReviewIds, useReviews } from "../../Context/Project.Review.context";
import { TableItemContext } from "../TableItem.context"
import { TableItemReview } from "../TableItemControls/TableItem.Review";

import * as _ from 'underscore';
import { ErrorLoading } from "../../../General/ErrorLoading";
import { CenteredSummaryContainer } from "../TableItemControls/TableItem.SummaryContainer";
import { SummaryText } from "../TableItemControls/TableItem.SummaryText";

const NoReviews = ({name, style}) => {
    const id = useId();
    const RowA = [
        {text: 'There are no Syncsketch Items uploaded yet for this Task...', id: id + '0'},
    ]

    return (
        <CenteredSummaryContainer style={style}>
            <SummaryText textArr={RowA} />
        </CenteredSummaryContainer>)
}

export const TableItemReviews = ({visible}) => {
    const { ActiveTab } = useContext(TableItemContext);
    const ActiveDepartment = ActiveTab.replace(' Reviews', '');
    const { BoardItemId, CurrentReviewId, Status } = useContext(BoardItemContext);
    const ReviewIds = useDepartmentReviews(BoardItemId, ActiveDepartment);

    if (ReviewIds === SUSPENSE)
        return <div>SUSPENDED</div>;

    
    return (
        <Stack direction="vertical" style={{display: visible ? null : 'none', height: '100%'}}>
        {
            !ReviewIds?.length ? 
            <NoReviews name={ActiveDepartment} /> :
            ReviewIds.map(id => 
                <TableItemReview key={id} ReviewId={id} ActiveDepartment={ActiveDepartment} 
                primary={CurrentReviewId === id ? Status.color : 'gray'}/>
            )
        }
        </Stack>
    )
}