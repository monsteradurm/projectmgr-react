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

const OnDepartmentClick = (evt, department, departmentRef, searchParams, setSearchParams) => {
    if (departmentRef.current.className.indexOf('hover') > -1) {
        evt.stopPropagation();
        evt.preventDefault();
        toggleArrFilter(department, 'BoardFeedbackDepartmentFilter', searchParams, setSearchParams)
    }
}

const AddHover = (ref) => {
    ref.current.className = "pm-status-hover"
}

const RemoveHover = (ref) => {
    ref.current.className = ""
}

export const TableItemStatus = () => {
    const { BoardItemId, CurrentReviewId } = useContext(BoardItemContext);
    const Status = useBoardItemStatus(BoardItemId);
    const [searchParams, setSearchParams] = useSearchParams();
    const Department = useReviewDepartment(CurrentReviewId)
    const statusRef = useRef();
    const departmentRef = useRef();
    const showDepartment = Department && (
        Status.text.indexOf('Feedback') >= 0 || Status.text.indexOf('Review') >= 0 || Status.text.indexOf('Approved') >= 0
    )
    return (
    <div className="pm-status" style={{background: Status.color}}>
            <span onMouseEnter={(evt) => AddHover(statusRef)} ref={statusRef}
                onClick={(evt) => OnStatusClick(evt, Status.text, statusRef, searchParams, setSearchParams)} 
                onMouseLeave={(evt) => RemoveHover(statusRef)}>
                {Status.text}
                
            </span>
            {
                showDepartment ? 
                <>
                    <span style={{marginLeft: 10}}>(</span>
                    <span ref={departmentRef}
                        onMouseEnter={(evt) => AddHover(departmentRef)}
                        onClick={(evt) => OnDepartmentClick(evt, Department, departmentRef, searchParams, setSearchParams)} 
                        onMouseLeave={(evt) => RemoveHover(departmentRef)}>
                        {Department}
                    </span> 
                    <span>)</span>
                </>: null
            }
    </div>)
}