import { take } from "rxjs";
import { ajax } from "rxjs/ajax";

export class IntegrationsService {
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
        ).subscribe(() => {})
    }
}