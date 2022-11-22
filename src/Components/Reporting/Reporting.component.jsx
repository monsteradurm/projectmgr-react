import { useEffect, useState } from "react"
import { Stack } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBusyMessage } from "../../App.MessageQueue.context";
import { SetNavigationHandler, SetTitles } from "../../Application.context"
import { render } from "react-dom";
import { ReactGrid, Column, Row } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { SetReportingBoardNesting, SetReportingProject, SetReportingProjectGroup, useReportingBoardNesting, useReportingProject, useReportingProjectGroup } from "./Reporting.context";
import { SUSPENSE } from "@react-rxjs/core";
import { Loading } from "../General/Loading";

const REP_ID = '/Calendar'

export const ReportingCompoennt = ({headerHeight}) => {
    const [initializing, setInitializing] = useState(true);
    const BusyMessage = useBusyMessage(REP_ID);

    const BoardNesting = useReportingBoardNesting();
    const Project = useReportingProject();
    const ProjectGroup = useReportingProjectGroup();
    
    const [searchParams, setSearchParams] = useSearchParams();
    SetNavigationHandler(useNavigate());
    
    useEffect(() => {
        SetReportingProjectGroup(searchParams.get("ProjectGroup") || null);
        SetReportingProject(searchParams.get("Project") || null);
        SetReportingBoardNesting(searchParams.get("Boards") || null);
    }, [searchParams])

    useEffect(() => {
        let titles= ["Reporting"];
        if (Project?.length)
            titles = [...titles, Project]
        if (Project?.length)
            titles = [...titles, Project]
        if (BoardNesting?.length)
            titles = [...BoardNesting];

        SetTitles(titles);
    }, [Project, BoardNesting, ProjectGroup])

    if ([Project, BoardNesting, ProjectGroup].indexOf(SUSPENSE) >= 0)
        return <Loading text="Retrieving Report Parameters..." />

    return (
        <div style={{padding: 30}}>
            <div>In Development...</div>
            <ReactGrid columns={[
                    { columnId: "ExampleRow", width: 150 },
                ]} rows={[{
                        rowId: "header",
                        cells: [
                            { type: "header", text: "Example Header" },  
                        ]
                    },
                    {
                        rowId: 0,
                        cells: [
                        { type: "text", text: "Example"}]
                    }]} />;
        </div>)
}