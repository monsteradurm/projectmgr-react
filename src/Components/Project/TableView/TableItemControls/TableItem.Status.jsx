import { useContext, useRef } from "react"
import { useSearchParams } from "react-router-dom";
import { BoardItemContext, useBoardItemStatus } from "../../Context/Project.Item.context"
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
    const { BoardItemId } = useContext(BoardItemContext);
    const Status = useBoardItemStatus(BoardItemId);
    const [searchParams, setSearchParams] = useSearchParams();
    const statusRef = useRef();

    return (
    <div className="pm-status" ref={statusRef}
        
        onClick={(evt) => OnStatusClick(evt, Status.text, statusRef, searchParams, setSearchParams)} 
            style={{background: Status.color}}>
        <span onMouseEnter={(evt) => AddStatusHover(statusRef)}
            onMouseLeave={(evt) => RemoveStatusHover(statusRef)}>{Status.text}</span>
    </div>)
}