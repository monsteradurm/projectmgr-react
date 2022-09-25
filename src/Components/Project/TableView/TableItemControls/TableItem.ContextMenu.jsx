import { ContextMenu } from "primereact/contextmenu";
import { useTableItemContextMenu } from "../TableItem.context";

export const TableItemContextMenu = ({BoardItemId, CurrentReviewId, ContextMenuRef}) => {
    const ItemContextMenu = useTableItemContextMenu(BoardItemId, CurrentReviewId);
    
    return (
        <ContextMenu model={ItemContextMenu} 
            ref={ContextMenuRef} 
            className="pm-row-context"></ContextMenu>
    )
}