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
import { toggleStatusFilter } from "../Project/Overview.filters";

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
    const [projectFilter, setProjectFilter] = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState(null);
    const [feedbackFilter, setFeedbackFilter] = useState(null);
    const [approversFilter, setApproversFilter] = useState(null)
    const [expandedRows, setExpandedRows] = useState([]); 

    const [forcedRefresh, setForcedRefresh] = useState(0);

    SetNavigationHandler(useNavigate());
    
    useEffect(() => {
        let dep = searchParams.get("Department");
        if (!dep?.length)
            dep = null;
        let fb = searchParams.get("FeedbackDepartment");
        if (!fb?.length)
            fb = null;

        let app = searchParams.get("Approvers");
        if (!app?.length)
            app = null;

        let proj = searchParams.get("Project");
        if (!proj?.length)
            proj = null;

        let searchChanged = false;

        if (proj !== projectFilter)
            setProjectFilter(proj);
        
        if(proj === null && searchParams.has('Project')) {
            searchParams.delete('Project');
            searchChanged = true;
        }

        if (dep !== departmentFilter)
            setDepartmentFilter(dep);

        if(dep === null && searchParams.has('Department')) {
            searchParams.delete('Department');
            searchChanged = true;
        }

        if (fb !== feedbackFilter)
            setFeedbackFilter(fb);

        if(!fb === null && searchParams.has('Feedback')) {
            searchParams.delete('Feedback');
            searchChanged = true;
        }

        if (app !== approversFilter)
            setApproversFilter(app);

        if(app === null && searchParams.has('Approvers')) {
            searchParams.delete('Approvers');
            searchChanged = true;
        }

        if (searchChanged)
            setSearchParams(searchParams);
        
        setForcedRefresh(forcedRefresh  + 1);
    }, [searchParams])

    useEffect(() => {
        
        if (Timesheets === SUSPENSE)
            return;

        let result = [...Timesheets];
        if (projectFilter?.length || feedbackFilter?.length || departmentFilter?.length || approversFilter?.length) {
            result = result.filter(r => r?.logs?.length);
            console.log("filtering: ", {projectFilter, departmentFilter, feedbackFilter, approversFilter});
            if (projectFilter?.length) {
                result = result.filter(r => r?.logs?.filter(l => l.ProjectId.startsWith(projectFilter))?.length)
            }

            if (departmentFilter?.length) {
                result = result.filter(r => r?.logs?.filter(l => l.Department === departmentFilter)?.length)
            }

            if (feedbackFilter?.length) {
                result = result.filter(r => r?.logs?.filter(l => l.FeedbackDepartment === feedbackFilter)?.length)
            }
            if (approversFilter?.length) {
                result = result.filter(r => {
                    
                    if (!r?.logs?.length) return false;
                    
                    const approved = r.approved;
                    if (!approved || approved.length < 1)
                        return false;

                    return approved.map(a => a.replace(/\s/g, '')).indexOf(approversFilter) >= 0;
                });
            }
        }
        setLogs(result);

        const sheets = result?.filter(l => !!l.artist);
        setSheetCount(sheets.length);
        const entries = _.flatten(_.pluck(logs, 'logs').filter(l => !!l && l.length));

        setHourCount(_.reduce(entries, (acc, e) => acc += e.hours || 0, 0));
        setTaskCount(_.uniq(_.pluck(entries, 'ItemId')).length);
        setProjectCount(_.uniq(_.pluck(entries, 'ProjectId')).length);
        setReviewCount(_.uniq(_.pluck(entries, 'ReviewId').filter(r => !!r)).length);
        setHourCount(_.reduce(entries, (acc, e) => acc += e.hours || 0, 0));

    }, [Timesheets, feedbackFilter, departmentFilter, projectFilter, approversFilter, forcedRefresh])

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

    
    const TagComponent = ({tags, searchKey}) => {
        const id = useId();

        if (!tags) return <></>

        return <Stack direction="horizontal" gap={1}>
        {
            tags.map(p => <div className="log-project-tag" key={id + "_" + p}
                onClick={() => toggleStatusFilter(p, searchParams, setSearchParams, searchKey)}>
                {p}
            </div>)
        }
        </Stack>
    }

    const ProjectsTemplate = (sheet) => {
        let projects = sheet?.logs?.map(l => l.ProjectId).filter(p => !!p) || [];
        if (projects.length < 1) return <></>

        projects = _.uniq(projects).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
        return <TagComponent tags={projects} searchKey="Project"/>
    }

    const FeedbackDepartmentsTemplate = (sheet) => {
        let departments = sheet?.logs?.map(l => l.FeedbackDepartment).filter(d => !!d) || [];
        if (departments.length < 1) return <></>

        departments = _.uniq(departments).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
        return <TagComponent tags={departments} searchKey="Feedback"/>
    }
    const DepartmentsTemplate = (sheet) => {
        let departments = sheet?.logs?.map(l => l.Department).filter(d => !!d) || [];
        if (departments.length < 1) return <></>

        departments = _.uniq(departments).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
        return <TagComponent tags={departments} searchKey="Department"/>
    }

    if (Timesheets === SUSPENSE)
        return <Loading text="Retrieving Timesheets..." />

    console.log("TIMESHEETS", Timesheets?.length)
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
            <Stack direction="horizontal" gap={1} className="pm-tag-filters"
                style={{fontSize: 18, marginRight: 100, marginLeft: 100, marginTop: -30, zIndex: 100}}>
                <div style={{marginRight: 20}}><span style={{fontWeight: 600}}>{sheetCount}</span> Timesheets...</div>
                {
                    projectFilter &&
                    <div className="pm-tag" key={"ProjectFilter" + "_" + projectFilter}
                        onClick={() => toggleStatusFilter(projectFilter, searchParams, setSearchParams, "Project")}>
                        #{projectFilter}
                    </div>

                }
                {
                    departmentFilter &&
                    <div className="pm-tag" key={"departmentFilter" + "_" + departmentFilter} 
                        onClick={() => toggleStatusFilter(departmentFilter, searchParams, setSearchParams, "Department")}>
                        #{departmentFilter}
                    </div>

                }
                {
                    feedbackFilter &&
                    <div className="pm-tag" key={"feedbackFilter" + "_" + feedbackFilter} 
                        onClick={() => toggleStatusFilter(feedbackFilter, searchParams, setSearchParams, "Feedback")}>
                        #{feedbackFilter}
                    </div>

                }
                {
                    approversFilter &&
                    <div className="pm-tag" key={"approversFilter" + "_" + approversFilter}
                        onClick={() => toggleStatusFilter(approversFilter, searchParams, setSearchParams, "Approvers")}>
                        #{approversFilter}
                    </div>

                }
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