import { bind, SUSPENSE } from "@react-rxjs/core";
import { partitionByKey } from "@react-rxjs/utils";
import { scan, tap } from "rxjs";
import { FirebaseService } from "../../Services/Firebase.service";

export const [useNoticeboard, Notices$] = bind(
    FirebaseService.Notices$.pipe(
        scan((acc, notice) => {
            if (!notice)
                return acc;
                
            if (notice.change === 'removed')
                return [...acc.filter(n => n.id !== notice.id)]
            
            return [...acc.filter(n => n.id !== notice.id), notice];
        }, []),
    ), SUSPENSE
)
