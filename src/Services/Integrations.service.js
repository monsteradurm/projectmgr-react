import { take, tap, map } from "rxjs";
import { ajax } from "rxjs/ajax";
import * as _ from 'underscore';
import { EOD_Main } from "./EOD.main";
import { EOD_Task } from "./EOD.Task";
import { EOD_Tomorrow } from "./EOD.tomorrow";
import moment from 'moment';

export class IntegrationsService {

    
    static Email_EndOfDay$(timesheet, mgr_emails, allUsers) {
        //(toAddress, subject, text, html)

        let emails = [...(mgr_emails || [])];
         
        const {artist, date, tomorrow, logs } = timesheet;
        const local = moment(date);
        const YYYY = local.format('YYYY');
        const Mo = local.format('MMM');
        const Do = local.format("Do");
        const tomorrow_html = EOD_Tomorrow(tomorrow, 'rgb(0, 156, 194)');
        const attachments = []
        let today_html = ''
        
        if (logs?.length) {
            const groups = _.groupBy(logs, l => l.ProjectId + ", " + l.BoardName);
            const grouped_keys = Object.keys(groups);
            grouped_keys.forEach(g => {
                
                
                const grouped = groups[g];
                
                grouped.forEach(log => {
                    emails = emails.concat(
                        log.Artists?.map(a => allUsers[a.toLowerCase()])
                            .map(a => a.monday.email) || []
                    );
                    console.log("ARTISTS: ", log.Artists, log.Artists?.map(a => allUsers[a.toLowerCase()])
                    .map(a => a.monday.email))
                    emails = emails.concat(
                        log.Directors?.map(a => allUsers[a.toLowerCase()])
                            .map(a => a.monday.email) || []
                    );

                    const index = grouped.indexOf(log);
                    const borderTop = grouped_keys.indexOf(g) !== 0 && index === 0;
                    const { ProjectId, BoardName, BoardId, GroupId, GroupName, ItemName, ReviewName, notes, FeedbackDepartment, Status, Thumbnail, Link } = log;
                    
                    let inline_thumb = log.id + '.jpg';
                    if (Thumbnail) {
                        attachments.push({filename: inline_thumb,
                            path: Thumbnail,
                        cid: inline_thumb})
                    }

                    let Element = ItemName;
                    let Task = '';
                    if (Element.indexOf('/') >= 0){
                        let arr = Element.split('/')
                        Element = arr[0];
                        Task = arr[1];
                    }

                    let subtitle2 = ReviewName;
                    if (FeedbackDepartment)
                        subtitle2 += ' (' + FeedbackDepartment + ')';

                    const BoardURL = `https://projectmgr.live/Projects?ProjectId=${ProjectId}&BoardId=${BoardId}&GroupId=${GroupId}`;
                    today_html += EOD_Task(BoardURL, ProjectId, BoardName, 
                        (GroupName !== 'All' && BoardName.indexOf(GroupName) < 0 ? GroupName + ', ' : '') + Element, 
                        Task, subtitle2, 
                        '<span style="font-style: italic;font-weight:bold">' + Status + '</span> - ' + notes , Link, inline_thumb, index === 0, borderTop);
                });
            })
        }
        
        emails = _.uniq(emails).join('; ');
        let payload = {
            toAddress: 'acranch@liquidanimation.com', //emails,
            subject: date + ', EOD Report (' + artist +')',
            html: EOD_Main(artist, Do, Mo, YYYY, today_html, tomorrow_html, 'rgb(0, 156, 194)' ),
            attachments
        }
        
        console.log("PAYLOAD", payload);

        payload.toAddress = 'acranch@liquidanimation.com';
        return ajax.post('/integrations/email', payload).pipe(
            tap(console.log),
            take(1),
            tap(res => console.log("/integrations/emais", {result: res}))
        )
    }

    static BoardItem_ForceStatusUpdate(itemId, boardId, Status) {
        
        const payload = {
            inputFields: {
                columnValue: Status,
                previousColumnValue: Status,
                itemId,
                boardId,
            },
            challenge: false,

        }
        console.log(payload);

        ajax.post('/integrations/monday/StoreBoardItemStatus', {payload}).pipe(
            take(1),
        ).subscribe((res) => {console.log("/integrations/monday/StoreBoardItemStatus => Result: ", res)})
    }
    static BoardItem_ForceArtistUpdate(pulseId, groupId, boardId) {
        
        const event = {
            pulseId, groupId, boardId
        }

        console.log(event);

        ajax.post('/integrations/monday/PersonColumnUpdated', {event, challenge: false}).pipe(
            take(1),
        ).subscribe((res) => {console.log("/integrations/monday/PersonColumnUpdated => Result: ", res)})
    }
}