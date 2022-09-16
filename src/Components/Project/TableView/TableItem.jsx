import { Panel } from "primereact/panel";
import { useContext, useState } from "react"
import { Stack } from "react-bootstrap";
import { ErrorLoading } from "../../General/ErrorLoading";
import { BoardItemContext, useBoardItemName, } from "../Context/Project.Item.context";
import { TableItemArtists } from "./TableItemControls/TableItem.Artists";
import { TableItemBadges } from "./TableItemControls/TableItem.Badges";
import { TableItemPane } from "./TableItem.Pane";
import { TableItemRow } from "./TableItem.Row";
import { ErrorBoundary } from "react-error-boundary"
import { TableItemProvider } from "./TableItem.context";
import { SUSPENSE } from "@react-rxjs/core";



export const TableItem = () => {
    const { BoardItemId, CurrentReviewId, Filtered } = useContext(BoardItemContext);
    const [isCollapsed, setCollapsed] = useState(true);
    const BoardItemName = useBoardItemName(BoardItemId)

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