import { Stack } from "react-bootstrap"

export const CenteredSummaryContainer = ({children, style}) => {
    return (<Stack direction="vertical" style={style} className="my-auto">
        <div className="my-auto">
            {children}
        </div>
    </Stack>)
}