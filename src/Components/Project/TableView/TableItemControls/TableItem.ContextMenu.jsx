import { ContextMenu } from "primereact/contextmenu";
import { useTableItemContextMenu } from "../TableItem.context";

export const TableItemContextMenu = ({BoardItemId, ContextMenuRef}) => {
    const ItemContextMenu = useTableItemContextMenu(BoardItemId);
    
    return (
        <ContextMenu model={ItemContextMenu} 
            ref={ContextMenuRef} 
            className="pm-row-context"></ContextMenu>
    )
}