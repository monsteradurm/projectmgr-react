import { faCheck, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Column, DataTable } from "primereact"
import { useEffect, useId, useState } from "react"
import { Stack } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import { SheetRibbonColor, TimesheetData, useTimesheetArtist, useTimesheets } from "./Timesheet.context";
import moment from 'moment';
import * as _ from 'underscore';

import "./Timesheet.scss";
import { TimeSheetFilterBar } from "./Timesheet.FilterBar";
import { SupportUsers } from "../Support/Support.Users";
import { SetTimesheetRange, useTimesheetRange, ThisWeek } from "./Timesheet.context"
import { Loading } from "../General/Loading";
import { SUSPENSE } from "@react-rxjs/core";
import { TimesheetLogs } from "./Timesheet.Logs";

const DateTemplate = (sheet) => {
    const date = sheet?.date;
    const dayOfWeek = moment(date).format('d');
    const isWeekend = dayOfWeek === '0' || dayOfWeek === '6';
    const primary = SheetRibbonColor(sheet);
    return <Stack direction="horizontal" gap={2}>
        <div className="mx-auto"></div>
        <div style={{fontSize: 20, color: isWeekend ? 'gray' : null}}>{moment(sheet.date).format('ddd')}</div>
        <div style={{fontSize: 20, fontWeight: 700, color: isWeekend ? '#888' : primary}}>{moment(sheet.date).format('Do')}</div>
        <div style={{fontSize: 20, fontWeight: 700, color: isWeekend ? '#aaa' : null}}>{moment(sheet.date).format('MMM')}</div>
    </Stack>;
}

const RibbonTemplate = (sheet) => {
    const background = SheetRibbonColor(sheet);
    return <div style={{background, width: '100%', minWidth:'100%', maxWidth: '100%', height:'100%'}}></div>
}

const ProjectTags = ({projects}) => {
    const id = useId();

    if (!projects) return <></>

    return <Stack direction="horizontal" gap={1}>
    {
    projects.map(p => <div className="log-project-tag" key={id + "_" + p}>{p}</div>)
    }
    </Stack>
}

const ProjectsTemplate = (sheet) => {
    let projects = sheet?.logs?.map(l => l.ProjectId).filter(p => !!p) || [];
    if (projects.length < 1) return <></>

    projects = _.uniq(projects).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
    return <ProjectTags projects={projects} />
}

const TasksTemplate = (sheet) => {
    if (!sheet?.logs) return <></>
    return sheet?.logs?.length || 0;
}

const HoursTemplate = (sheet) => {
    const logs = sheet?.logs;
    if (!logs) return <></>

    return _.reduce(logs, (acc, log) => acc += (log?.hours || 0), 0);
}

const TomorrowTemplate = (log) => {
    return log?.tomorrow && <FontAwesomeIcon icon={faCircleCheck} className="log-tick" />;
}

const FeedbackDepartmentsTemplate = (sheet) => {
    let departments = sheet?.logs?.map(l => l.FeedbackDepartment).filter(d => !!d) || [];
    if (departments.length < 1) return <></>

    departments = _.uniq(departments).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
    return <ProjectTags projects={departments} />
}
const DepartmentsTemplate = (sheet) => {
    let departments = sheet?.logs?.map(l => l.Department).filter(d => !!d) || [];
    if (departments.length < 1) return <></>

    departments = _.uniq(departments).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
    return <ProjectTags projects={departments} />
}

const SubmittedTemplate = (log) => {
    return log?.submitted ? <FontAwesomeIcon icon={faCircleCheck} className="log-tick" /> 
    : log?.projects ? <Button>Submit</Button> : null;
}

const ApprovedTemplate = (log) => {
    if (!log?.approved || log.approved.length < 1)
        return <></>
    return(<SupportUsers artists={log.approved} id={log.id} searchKey="Approvers"
        color="rgb(0, 156, 194)" align="right"/>)
}

export const TimesheetComponent = ({}) => {
    const [logs, setLogs] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [header, setHeader] = useState('This Week');
    const Range = useTimesheetRange();
    const Timesheets = useTimesheets();
    const User = useTimesheetArtist();
    const [sheetCount, setSheetCount] = useState(null);
    const [hourCount, setHourCount] = useState(null);
    const [taskCount, setTaskCount] = useState(null);
    const [reviewCount, setReviewCount] = useState(null);
    const [projectCount, setProjectCount] = useState(null);

    const [expandedRows, setExpandedRows] = useState([]); 

    SetNavigationHandler(useNavigate());
    
    useEffect(() => {
        if (Timesheets === SUSPENSE)
            return;

        let result = [...Timesheets];

        setLogs(result);

        const sheets = result?.filter(l => !!l.artist);
        setSheetCount(sheets.length);
        const entries = _.flatten(_.pluck(sheets, 'logs').filter(l => !!l && l.length));

        setHourCount(_.reduce(entries, (acc, e) => acc += e.hours || 0, 0));
        setTaskCount(_.uniq(_.pluck(entries, 'ItemId')).length);
        setProjectCount(_.uniq(_.pluck(entries, 'ProjectId')).length);
        setReviewCount(_.uniq(_.pluck(entries, 'ReviewId').filter(r => !!r)).length);
        setReviewCount(_.reduce(entries, (acc, e) => acc += e.hours || 0, 0));

    }, [Timesheets])

    useEffect(() => {
        const range_str = JSON.stringify(Range);
        if (range_str === JSON.stringify(ThisWeek))
            setHeader('This Week');

        else {
            const years = Range.map(d => moment(d).format('YYYY'));
            const sameYears = years[0] === years[1];
            if (sameYears)
                setHeader(Range.map(d => moment(d).format('MMM Do')).join(' - ') + ', ' + years[0])
            else
                setHeader(Range.map(d => moment(d).format('MMM Do YYYY')).join(' - '))
        }
    }, [Range])

    useEffect(() => {
        let titles = ['Home', 'Timesheets'];
        if (User)
            titles.push(User);
        SetTitles(titles);
    }, [User])

    if (Timesheets === SUSPENSE)
        return <Loading text="Retrieving Timesheets..." />

    return (
        <>
        <TimeSheetFilterBar />
        <Stack direction="vertical">
            <div style={{fontSize: 30, marginBottom: 10, marginTop: 10, fontWeight: 700, color: '#555',
                textAlign: 'left', paddingLeft: 100}}>{header}</div>
            <DataTable value={logs} className="pm-timesheet" style={{paddingTop: 0}} scrollable scrollHeight="calc(100vh - 250px)" 
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={TimesheetLogs} dataKey="date" expandedRows={expandedRows}>
                <Column body={RibbonTemplate} style={{width: 15, maxWidth: 15}} className="log-ribbon" />
                <Column expander style={{ width: 50, maxWidth: 50 }} className="log-expander" />
                <Column header="Date" body={DateTemplate} className="log-date" style={{width: 180, maxWidth: 180}}></Column>
                <Column header="Projects" body={ProjectsTemplate} className="log-projects"></Column>
                <Column header="Departments" body={DepartmentsTemplate} className="log-projects"></Column>
                <Column header="Feedback" body={FeedbackDepartmentsTemplate} className="log-projects"></Column>
                <Column header="Tasks" body={TasksTemplate} className="log-tasks" style={{width: 150, maxWidth: 150}}></Column>
                <Column header="Hours" body={HoursTemplate} className="log-hours" style={{width: 150, maxWidth: 150}}></Column>
                <Column header="Tomorrow" body={TomorrowTemplate} className="log-hours" style={{width: 150, maxWidth: 150}}></Column>
                <Column header="Submitted" body={SubmittedTemplate} className="log-submitted" style={{width: 150, maxWidth: 150}}></Column>
                <Column header="Approved" body={ApprovedTemplate} className="log-approved" style={{width: 200, maxWidth: 200}}></Column>
                <Column body={RibbonTemplate} style={{width: 15, maxWidth: 15}} className="log-ribbon" />
            </DataTable>
            <Stack direction="horizontal" gap={1} style={{fontSize: 18, marginRight: 100, marginLeft: 100, marginTop: -30}}>
                <div><span style={{fontWeight: 600}}>{sheetCount}</span> Timesheets...</div>
                <div className="mx-auto"></div>
                <div style={{fontWeight: 600}}>{projectCount}</div>
                <div>Projects, </div>
                <div style={{marginLeft: 10, fontWeight: 600}}>{taskCount}</div>
                <div>Tasks, </div>
                <div style={{marginLeft: 10, fontWeight: 600}}>{reviewCount}</div>
                <div>Reviews, </div>
                <div style={{marginLeft: 10, fontWeight: 600}}>{hourCount}</div>
                <div>Hours </div>
            </Stack>
        </Stack>
    </>)
}