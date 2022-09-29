import { ContextMenu } from "primereact/contextmenu";
import { useRef } from "react";
import { useReviewContextMenu } from "./TableItem.Review.Context";

/*

CurrentReviewId={CurrentReviewId} ReviewItems={ReviewItems} 
                Delivered={Delivered} CurrentItemIndex={CurrentItemIndex}
                */
export const TableItemReviewContextMenu = ({BoardItemId, CurrentReviewId, SiblingDepartments,
        ReviewItems, CurrentItemIndex, Delivered, Artists, ContextMenuRef}) => {

    const ItemContextMenu = useReviewContextMenu(BoardItemId, CurrentReviewId, 
        ReviewItems, CurrentItemIndex, Delivered, Artists, SiblingDepartments);

    return (
        <ContextMenu model={ItemContextMenu} 
            ref={ContextMenuRef} 
            className="pm-row-context"></ContextMenu>
    )
}