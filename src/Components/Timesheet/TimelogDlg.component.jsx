import { Button, Calendar, Dialog, Fieldset, InputNumber, InputTextarea } from "primereact"
import { Stack } from "react-bootstrap";
import { useState, useRef, useEffect, useId, useMemo, memo } from "react";
import { useLoggedInUser, useMondayUser } from "../../Application.context";
import { SetTimelogBoardId, SetTimelogGroupId, SetTimelogItemId, SetTimelogProjectId, 
    SetTimelogReviewId, SetTimesheetDate, ShowTimelogDialog, SubmitTimeEntry, useTimelogBoardId, 
    useTimelogBoardName, useTimelogGroupName, useTimelogItemName,
    useTimelogBoardOptions, useTimelogDlg, useTimelogFeedbackItemDepartment, useTimelogGroupId, useTimelogGroupOptions, useTimelogItem, 
    useTimelogItemDepartment, 
    useTimelogItemId, useTimelogItemOptions, useTimelogProjectId, useTimelogProjectOptions, useTimelogReviewId, 
    useTimelogReviewName, 
    useTimelogReviewOptions, useTimeLogReviews, useTimesheet, useTimesheetArtist, useTimesheetDate, useTimelogElementTask, useTimelogItemStatus, useTimelogReviewThumbnail, useTimelogReviewLink, useTimelogDirectors, useTimelogArtists } from "./Timesheet.context"
import moment from 'moment';
import * as _ from 'underscore';

import { SUSPENSE } from "@react-rxjs/core";
import { useBoardItemName } from "../Project/Context/Project.Item.context";
import { DialogHeader } from "../General/DialogHeader";
import { Dropdown } from "primereact/dropdown";
import { GenerateUUID } from "../../Helpers/UUID";
import { SetProjectId } from "../Project/Context/Project.Params.context";
import { SendToastError } from "../../App.Toasts.context";




const DlgDropdown = ({value, options, onChange, title, optionLabel, optionValue, width}) => {
    return (
        <span className="p-float-label" style={{width: width ? width : null}}>
            <Dropdown id={title} value={value} options={options} onChange={(e) => onChange(e.value)} 
            optionLabel={optionLabel} optionValue={optionValue} panelClassName="log-dropdown-panel"></Dropdown>
            <label htmlFor={title}>{title}</label> 
        </span>
    )
}

export const TimelogDlg = ({}) => {
    const visible = useTimelogDlg();
    const Date = useTimesheetDate();
    const User = useTimesheetArtist();
    const ProjectId = useTimelogProjectId();
    const ProjectOptions = useTimelogProjectOptions();
    const GroupOptions = useTimelogGroupOptions();
    const BoardOptions = useTimelogBoardOptions();
    const ItemOptions = useTimelogItemOptions();
    const ReviewOptions = useTimelogReviewOptions();
    const BoardName = useTimelogBoardName();
    const GroupName = useTimelogGroupName();
    const ItemName = useTimelogItemName();
    const BoardId = useTimelogBoardId();
    const GroupId = useTimelogGroupId();
    const ItemId = useTimelogItemId();
    const Department = useTimelogItemDepartment();
    const FeedbackDepartment = useTimelogFeedbackItemDepartment();
    const ReviewName = useTimelogReviewName();
    const ReviewId = useTimelogReviewId();
    const Status = useTimelogItemStatus();
    const Thumbnail = useTimelogReviewThumbnail();
    const Link = useTimelogReviewLink();
    const Item = useTimelogItem();
    const Directors = useTimelogDirectors();
    const Artists = useTimelogArtists();

    const [hours, setHours] = useState(1);
    const [notes, setNotes] = useState('');
    const [entry, setEntry] = useState(null);
    const Sheet = useTimesheet();
    const dialogRef = useRef();

    useEffect(() => {
        resetEntry();
    }, [visible])

    const resetEntry = () => {
        setHours(1);
        setNotes('');
        setEntry(null);
    }

    useEffect(() => {
        
        if (!Sheet || !Sheet?.logs?.length) {
            resetEntry()
            return;
        }

        const logs = Sheet.logs;
        let result = _.find(logs, l => l.BoardId === BoardId && l.ProjectId === ProjectId && l.GroupId === GroupId && l.ItemId === ItemId
            && l.ReviewId === ReviewId)
             
        if (!result) {
            resetEntry();
            return;
        }
        setEntry(result);

        if (result.notes?.length)
            setNotes(result.notes)
        else setNotes('');

        if (result.hours)
            setHours(result.hours);
        else setHours(1);

    }, [Sheet, BoardId, ProjectId, GroupId, ItemId, ReviewId])

    const header = useMemo(() => 
        <DialogHeader color="black" Header="New Timesheet Entry" onClose={() => ShowTimelogDialog(false)}/>
    , [])


    if (!visible)
        return <></>

    return (
        <Dialog id="pm-new-timelog" showHeader={true} visible={visible} style={{overflowY: 'hidden'}}
            header={header} closable={false}
            className="pm-dialog" ref={dialogRef} onHide={() => ShowTimelogDialog(false)}>
                <Stack id="timelog-container" gap={3} style={{padding: 30, height: '100%'}}>
                <Fieldset legend="Item">
                    <Stack direction="horizontal" gap={3}>
                        {
                            ProjectOptions ? <DlgDropdown options={ProjectOptions} value={ProjectId} optionLabel="label" optionValue="value"
                            onChange={SetTimelogProjectId} title="Project"/> : null
                        }
                        {
                            BoardOptions && <DlgDropdown options={BoardOptions} value={BoardId} optionLabel="name" optionValue="id"
                            onChange={SetTimelogBoardId} title="Board" />
                        }
                        {
                            GroupOptions && <DlgDropdown options={GroupOptions} value={GroupId} optionLabel="name" optionValue="id"
                            onChange={SetTimelogGroupId} title="Group"/>
                        }
                    </Stack>
                    <Stack direction="horizontal" gap={3} style={{marginTop: 40}}>
                        {
                            ItemOptions && <DlgDropdown options={ItemOptions} value={ItemId} optionLabel="name" optionValue="id"
                            onChange={SetTimelogItemId} title="Item"/>
                        }

                        {
                            ReviewOptions && <DlgDropdown options={ReviewOptions} value={ReviewId} optionLabel="name" optionValue="id"
                            onChange={SetTimelogReviewId} title="Review" />
                        }
                    </Stack>
                </Fieldset>
                
                <Fieldset legend="Log" style={{marginTop: 20}}>
                    <Stack direction="horizontal" gap={3} style={{marginTop: 20}}>
                        <span className="p-float-label" style={{width: 250}}>
                            <label htmlFor="icon">Date</label>
                            <Calendar id="icon" value={Date} dateFormat="yy-mm-dd" panelClassName="pm-timesheet-date"
                                onChange={(e) => SetTimesheetDate(e.value)} showIcon/>
                        </span>

                        <span className="p-float-label" style={{width: 250, marginLeft: 20}}>
                            <label htmlFor="hours">Approximate Hours</label>
                            <InputNumber inputId="hours" value={hours} step={0.5}
                                onValueChange={(e) => setHours(e.value)} mode="decimal" showButtons min={0.5} max={8} />
                        </span>

                    
                    </Stack>
                    <span className="p-float-label" style={{marginTop: 40}}>
                        <label htmlFor="notes">Additional Task Notes</label>
                        <InputTextarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} cols={30} 
                            style={{border: 'solid 1px gray', fontSize: 18, marginTop: 10}}/>
                    </span>
                </Fieldset>
                    
                    <Stack direction="horizontal" style={{marginBottom: 0, marginTop: 20}}>
                        <div className="mx-auto"></div>
                        <Button style={{fontSize: 18, fontWeight: 600, width: 200, justifyContent: 'center'}}
                            onClick={() => {
                                if (!hours || !ProjectId?.length || !BoardId?.lenght || !GroupId?.length || !ItemId?.length
                                    || !Department?.length || !ItemName?.length) {
                                        SendToastError("Missing minimum data to submit entry");
                                        return;
                                    }


                                let result = {id: GenerateUUID()};
                                if (entry) 
                                    result = {...entry};

                                result.hours = hours;
                                result.notes = notes;
                                result.ProjectId = ProjectId;
                                result.BoardId = BoardId;
                                result.BoardName = BoardName;
                                result.GroupId = GroupId;
                                result.GroupName = GroupName;
                                result.ItemId = ItemId;
                                result.ItemName = ItemName;
                                result.ReviewId = ReviewId;
                                result.Department = Department;
                                result.FeedbackDepartment = FeedbackDepartment;
                                result.ReviewName = ReviewName;
                                result.Thumbnail = Thumbnail;
                                result.Directors = Directors;
                                result.Artists = Artists;
                                result.Link = Link;
                                result.Status = Status;
                                result.updated = moment(moment.now()).format('YYYY-MM-DD HH:mm:ss')
                                SubmitTimeEntry(result)
                            }}>Save Entry</Button>
                    </Stack>
            </Stack>
        </Dialog>)
}