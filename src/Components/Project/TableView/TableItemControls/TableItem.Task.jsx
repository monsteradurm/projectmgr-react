import { SUSPENSE } from "@react-rxjs/core";
import { useContext } from "react";
import { BoardItemContext, useBoardItemName } from "../../Context/Project.Item.context"
import { useBoardGrouping } from "../../Context/Project.Params.context";
import * as _ from 'underscore';

export const TableItemTask = () => {
    const { BoardItemId } = useContext(BoardItemContext);
    const [ Element, Task ] = useBoardItemName(BoardItemId);
    const Grouping = useBoardGrouping();
    
    // do not display if parameters are suspended
    if (_.find([BoardItemId, Element, Grouping, Task], t => t === SUSPENSE)) 
        return null;

    return (
        <div className="pm-task">
        {
            Grouping != 'Element' ?
            <span style={{fontWeight:600, marginRight: '10px', 
                position: 'absolute', left: '110px'}}>
                {Element}
            </span> : null
        }

        {
            Task ? Task : Element 
        }
        </div>
    )
}