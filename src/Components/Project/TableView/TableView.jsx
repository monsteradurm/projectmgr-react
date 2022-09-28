
import { BoardItemProvider } from "../Context/Project.Item.context";
import { useGroupedBoardItems, useFilteredBoardItemIds } from "../Context/Project.Objects.context"
import { ProjectItem } from "../ProjectItem/ProjectItem.component";
import { TableItem } from "./TableItem";
import { createSignal } from "@react-rxjs/utils";
import { bind } from "@react-rxjs/core";
import { BehaviorSubject } from "rxjs";
import { TableItemUploadReview } from "./TableItemDlgs/TableItem.UploadReview";
import { TableItemEditTags } from "./TableItemDlgs/TableItem.EditTags";
import { TableItemEditDescription } from "./TableItemDlgs/TableItem.Description";
import { TableItemEditTimeline } from "./TableItemDlgs/TableItem.EditTimeline";
import { TableItemEditDeliveredDate } from "./TableItemDlgs/TableItem.EditDeliveredDate";
import { TableItemAddToReview } from "./TableItemDlgs/TableItem.AddToReview";

// hold boarditem id for when a mouse is over a boarditem row
const [MouseOverRowChanged$, SetMouseOverRow] = createSignal()
const [useMouseOverRow, MouseOverRow$] = bind(
    MouseOverRowChanged$, null
)

export const TableView = () => {
    const GroupedBoardItems = useGroupedBoardItems();
    const FilteredIds = useFilteredBoardItemIds();
    if (!GroupedBoardItems) return <></>;

    return(<>
        <TableItemUploadReview />
        <TableItemEditTags />
        <TableItemEditDescription />
        <TableItemEditTimeline />
        <TableItemEditDeliveredDate />
        <TableItemAddToReview />
        {
            GroupedBoardItems.map(([group, ids]) => {
                
                // adjust styling so that pre fetched observables / images do not need to reload
                const display = ids.filter(id => FilteredIds.indexOf(id) >= 0)
                    .length > 0 ? null : 'none';

                return (
                    <div key={group} className="pm-item-container" style={{display}}>
                        <div className="pm-element">{group}</div>
                            {
                                ids.map(id => 
                                <div key={id} className="pm-task-container" 
                                    onMouseOver={() => SetMouseOverRow(id)}>   
                                    <BoardItemProvider BoardItemId={id}>
                                        <TableItem />
                                    </BoardItemProvider>
                                </div>)
                            }
                    </div>
                )
            })
        }
    </>)
}