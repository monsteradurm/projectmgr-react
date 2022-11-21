import { useEffect, useState } from "react"
import { Stack } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBusyMessage } from "../../App.MessageQueue.context";
import { SetNavigationHandler, SetTitles } from "../../Application.context"

const REP_ID = '/Calendar'

export const ReportingCompoennt = ({headerHeight}) => {
    const [initializing, setInitializing] = useState(true);
    const BusyMessage = useBusyMessage(REP_ID);
    const [project, setProject] = useState([]);
    const [boards, setBoards] = useState([]);
    const [projectGroup, setProjectGroup] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    
    SetNavigationHandler(useNavigate());
    
    useEffect(() => {
        setProjectGroup(searchParams.get("ProjectGroup") || null);
        setProject(searchParams.get("Project") || null);

        const boardParams = searchParams.get("Boards") || null;
        if (boardParams?.indexOf(','))
            setBoards(boardParams.split(','))
        else 
            setBoards(boardParams ? [boardParams] : null);
    }, [searchParams])

    useEffect(() => {
        let titles= ["Reporting"];
        if (projectGroup?.length)
            titles = [...titles, projectGroup]
        if (project?.length)
            titles = [...titles, project]
        if (boards?.length)
            titles = [...titles, ...boards];

        SetTitles(titles);

    }, [project, boards, projectGroup])

    return <Stack direction="horizontal" style={{padding: 30, justifyContent: 'center', textAlign:'center', width: '100%'}}>
        In Development...
        </Stack>
}