import { take, tap, map } from "rxjs";
import { ajax } from "rxjs/ajax";
import * as _ from 'underscore';

export class IntegrationsService {
    static Email_EndOfDay$(timesheet, emails) {
        //(toAddress, subject, text, html)

        const {artist, date, tomorrow, logs } = timesheet;
        let html = `<div style="width: 100%">`
        html += `<p style="font-size:14px"><strong>${artist} </strong>has submitted an EOD Report for <strong>${date}</strong></p>
        <div style="width:100%;padding-bottom:5px;border-bottom:solid 2px rgb(0, 133, 119);margin-right:30px"><strong>Today</strong></div>`
        if (logs?.length) {
            const groups = _.groupBy(logs, l => l.ProjectId + ", " + l.BoardName);

            Object.keys(groups).forEach(g => {
                const grouped = groups[g];
                html += `<div style="font-weight: 600;margin-left:20px;margin-bottom:5px;margin-top:15px">${g}</div>`
                grouped.forEach(log => {
                    const { ProjectId, BoardName, GroupName, ItemName, ReviewName, notes, FeedbackDepartment } = log;
        
                    html += `<div style="margin-left:45px;margin-top:10px">${GroupName}, ${ItemName}`; 
                    
                    if (ReviewName) {
                        html += ', ' + ReviewName
                        if (FeedbackDepartment)
                            html += ' (' + FeedbackDepartment
                        html += ')'
                    }
                    html += '</div>'
                    if (notes)
                        html += `<div style="margin-left:70px; font-size: 14px; font-weight: 300">${notes}</div>`
                    else 
                        html += '<div style="padding-left:45px; font-size: 14px; font-weight: 300;font-style:italic">No Notes Provided...</div>'
                });
            })
        } else {
            html += '<div style="margin-left:20px; font-size: 14px; font-weight: 300;font-style:italic">No Notes Provided...</div>'
        }

        html += `<p><div style="width:100%;padding-bottom:5px;border-bottom:solid 2px rgb(0, 133, 119);margin-top:10px;margin-right:30px"><strong>Tomorrow</strong></div></p><p style="padding-left:25px;font-size:14px">${tomorrow}</p>`
        html += '</div>'

        const payload = {
            toAddress: emails,
            subject: date + ', EOD Report (' + artist +')',
            html
        }
        

        return ajax.post('/integrations/email', payload).pipe(
            take(1),
            tap(res => console.log("/integrations/emais", html, {result: res}))
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