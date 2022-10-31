import { SUSPENSE } from "@react-rxjs/core";
import { useContext } from "react";
import { BoardItemContext, useBoardItemCode, useBoardItemName } from "../../Context/Project.Item.context"
import { useBoardGrouping } from "../../Context/Project.Params.context";
import * as _ from 'underscore';
import { Stack } from "react-bootstrap";

export const TableItemTask = () => {
    const { BoardItemId } = useContext(BoardItemContext);
    const [ Element, Task ] = useBoardItemName(BoardItemId);
    const ItemCode = useBoardItemCode(BoardItemId);
    const Grouping = useBoardGrouping();
    
    // do not display if parameters are suspended
    if (_.find([BoardItemId, Element, Grouping, Task], t => t === SUSPENSE)) 
        return null;

    return (
        <div className="pm-task">
        {
            Grouping != 'Element' ?
            <span style={{fontWeight:700, marginRight: '10px', 
                position: 'absolute', left: '110px', fontSize: 16}}>
                {Element}
            </span> : null
        }

        {
            ItemCode && Grouping !== 'Element'? 
            <Stack direction="vertical" style={{paddingTop: 3}}>
                <div style={{fontWeight: 700}}>{Task ? Task : Element}</div>
                <div style={{marginTop: -2}}>{ItemCode}</div> 
            </Stack> : <span style={{fontWeight: 700}}>{Task ? Task : Element}</span>
        }
        </div>
    )
}