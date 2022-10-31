import { Panel } from "primereact/panel";
import { useContext, useState } from "react"
import { Stack } from "react-bootstrap";
import { ErrorLoading } from "../../General/ErrorLoading";
import { BoardItemContext, useBoardItemCode, useBoardItemName, } from "../Context/Project.Item.context";
import { TableItemArtists } from "./TableItemControls/TableItem.Artists";
import { TableItemBadges } from "./TableItemControls/TableItem.Badges";
import { TableItemPane } from "./TableItem.Pane";
import { TableItemRow } from "./TableItem.Row";
import { ErrorBoundary } from "react-error-boundary"
import { TableItemProvider } from "./TableItem.context";
import { SUSPENSE } from "@react-rxjs/core";
import { useBoardGrouping } from "../Context/Project.Params.context";



export const TableItem = ({index}) => {
    const { BoardItemId, CurrentReviewId, Filtered } = useContext(BoardItemContext);
    const [isCollapsed, setCollapsed] = useState(true);
    const BoardItemName = useBoardItemName(BoardItemId)
    const Grouping = useBoardGrouping();
    const Code = useBoardItemCode(BoardItemId);
    console.log(Grouping, Code);
    if (!BoardItemId || CurrentReviewId === SUSPENSE)
        return;

    return (
    <TableItemProvider BoardItemId={BoardItemId} CurrentReviewId={CurrentReviewId}>
        <div style={{display: Filtered ? null : 'none'}}>
            <ErrorBoundary FallbackComponent={() => 
                    <div style={{marginTop: -25, marginBottom: 5}}>
                        <ErrorLoading text={"There was an error loading BoardItem: "
                            + BoardItemName
                        } iconSize="2x" />
                    </div>
                }>
                {
                    (index === 0 && Grouping === 'Element' && !!Code && Code !== SUSPENSE && Code?.length > 0) &&
                    <div style={{position:'absolute', top: -26, right: 0, fontSize: 16, color: '#777', fontWeight: 600}}>{Code}</div>
                }
                <div key="task-left" className="pm-task-left">
                    <TableItemArtists />
                </div>
                <Panel headerTemplate={<TableItemRow isCollapsed={isCollapsed} setCollapsed={setCollapsed}/>} 
                        style={{marginBottom:'10px'}} 
                        collapsed={isCollapsed} 
                        onToggle={(e) => setCollapsed(!isCollapsed)} toggleable>
                        <TableItemPane BoardItemId={BoardItemId} CurrentReviewId={CurrentReviewId} />
                </Panel>
                <div key="task-right" className="pm-task-right">
                    <Stack direction="horizontal" gap={2}>
                        <TableItemBadges />
                    </Stack>
                </div>
            </ErrorBoundary>
        </div>
    </TableItemProvider>)
}