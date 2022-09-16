import { Stack } from "react-bootstrap";
import { TableItemStatus } from "./TableItemControls/TableItem.Status";
import { TableItemTask } from "./TableItemControls/TableItem.Task";
import { TableItemReviewSummary } from "./TableItemControls/TableItem.ReviewSummary";
import { TableItemTags } from "./TableItemControls/TableItem.Tags";
import { TableItemThumbnail } from "./TableItemControls/TableItem.Thumbnail";
import { useContext, useRef } from "react";
import { ShowContextMenu, TableItemContext, useTableItemContextMenu } from "./TableItem.context";
import { ContextMenu } from "primereact/contextmenu";
import "./TableItem.Row.scss";
import { BoardItemContext } from "../Context/Project.Item.context";
import { SUSPENSE } from "@react-rxjs/core";
import { TableItemContextMenu } from "./TableItemControls/TableItem.ContextMenu";

export const TableItemRow = ({isCollapsed, setCollapsed}) => {
    const {BoardItemId, CurrentReviewId} = useContext(BoardItemContext);
    const RowContextMenuRef = useRef();
    
    return (
        <Stack direction="horizontal" 
            onClick={(() => setCollapsed(!isCollapsed))} 
            onContextMenu={(evt) => ShowContextMenu(evt, BoardItemId, RowContextMenuRef)}
            className={isCollapsed ? "pm-projectItem" : "pm-projectItem expanded"}>
            <TableItemContextMenu BoardItemId={BoardItemId} ContextMenuRef={RowContextMenuRef}/>
            <TableItemThumbnail />
            <TableItemTask />
            <TableItemStatus />
            <TableItemReviewSummary />
            <TableItemTags />
        </Stack>
    );
}