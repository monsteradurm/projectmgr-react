import { Stack } from "react-bootstrap"
import { CenteredSummaryContainer } from "../Project/TableView/TableItemControls/TableItem.SummaryContainer"
import { usePriorityOptions, useSupportGroups, useSupportSettings, useStatusOptions } from "./Support.context"

export const Tickets = ({Board, Group}) => {
    const Settings = useSupportSettings(Board);
    const PriorityOptions = usePriorityOptions(Board);
    const StatusOptions = useStatusOptions(Board);
    return <Stack style={{height: '100%', width: '100%'}}>
        <CenteredSummaryContainer>
            <div style={{width: '100%', textAlign: 'center', fontSize: 20}}>There is currently no
                <span style={{fontWeight: 600, marginLeft: 5, marginRight: 5}}>{Board}</span>
                    Tickets within the
                <span style={{fontWeight: 600, marginLeft: 5, marginRight: 5}}>{Group}</span>
                    Category
                </div>

        </CenteredSummaryContainer>
        </Stack>
}