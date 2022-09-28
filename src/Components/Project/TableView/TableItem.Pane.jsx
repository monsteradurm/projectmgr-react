import { Menubar } from "primereact/menubar";
import { ScrollPanel } from "primereact/scrollpanel";
import { useContext, useState } from "react";
import { BoardItemContext } from "../Context/Project.Item.context";
import { TableItemContext, useReferenceMenu, useReviewsMenu, useSummaryMenu } from "./TableItem.context";
import { SUSPENSE } from "@react-rxjs/core";
import { TableItemReference } from "./TableItemPanes/TableItem.Pane.Reference";
import { TableItemReviews } from "./TableItemPanes/TableItem.Pane.Reviews";
import { TableItemSummary } from "./TableItemPanes/TableItem.Pane.Summary";

export const TableItemPane = ({}) => {
    const { BoardItemId, CurrentReviewId } = useContext(BoardItemContext);
    const { ActiveTab} = useContext(TableItemContext);
    const displayReference = ActiveTab?.indexOf('Reference') > -1;
    const displayReviews = ActiveTab?.indexOf('Reviews') > -1;
    const displaySummary = ActiveTab === 'Summary';
    const ReviewsMenu = useReviewsMenu(BoardItemId);
    const ReferenceMenu = useReferenceMenu(BoardItemId);
    const SummaryMenu = useSummaryMenu(BoardItemId);
  
    return (
        <>
            <Menubar model={[ReviewsMenu, ReferenceMenu, SummaryMenu]} />
            <ScrollPanel style={{width: '100%', height: '400px'}} className="pm">
                <TableItemReference visible={displayReference} />
                <TableItemReviews visible={displayReviews} />
                <TableItemSummary visible={displaySummary} />
            </ScrollPanel>
        </>
    )
};