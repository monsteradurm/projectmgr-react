import { useContext, useRef } from "react"
import { useSearchParams } from "react-router-dom";
import { BoardItemContext, useBoardItemStatus } from "../../Context/Project.Item.context"
import { useReviewDepartment } from "../../Context/Project.Review.context";
import { toggleArrFilter } from "../../Overview.filters";

const OnStatusClick = (evt, status, statusRef, searchParams, setSearchParams) => {
    if (statusRef.current.className.indexOf('hover') > -1) {
        evt.stopPropagation();
        evt.preventDefault();
        toggleArrFilter(status, 'BoardStatusFilter', searchParams, setSearchParams)
    }
}

const AddStatusHover = (statusRef) => {
    statusRef.current.className = "pm-status pm-status-hover"
}

const RemoveStatusHover = (statusRef) => {
    statusRef.current.className = "pm-status"
}

export const TableItemStatus = () => {
    const { BoardItemId, CurrentReviewId } = useContext(BoardItemContext);
    const Status = useBoardItemStatus(BoardItemId);
    const [searchParams, setSearchParams] = useSearchParams();
    const Department = useReviewDepartment(CurrentReviewId)
    const statusRef = useRef();

    const showDepartment = Department && (
        Status.text.indexOf('Feedback') >= 0 || Status.text.indexOf('Review') >= 0 || Status.text.indexOf('Approved') >= 0
    )
    return (
    <div className="pm-status" ref={statusRef}
        
        onClick={(evt) => OnStatusClick(evt, Status.text, statusRef, searchParams, setSearchParams)} 
            style={{background: Status.color}}>
        <span onMouseEnter={(evt) => AddStatusHover(statusRef)}
            onMouseLeave={(evt) => RemoveStatusHover(statusRef)}>
                {Status.text}
                {
                    showDepartment ? <span style={{marginLeft: 10}}>({Department})</span> : null
                }
            </span>
    </div>)
}