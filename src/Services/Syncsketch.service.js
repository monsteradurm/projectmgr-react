import { ajax } from "rxjs/ajax";
import { httpOptions, MissingSyncsketchProject, SyncsketchConfig, SyncsketchPosts, SyncsketchQueries } from "../Environment/Syncsketch.environment";
import * as _ from 'underscore';
import { take, map, tap, forkJoin, switchMap, from, concatMap, of, concatAll, Subject, merge } from "rxjs";
import moment from 'moment'

const QueryHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Authorization': `apikey ${SyncsketchConfig.user}:${SyncsketchConfig.token}`
}
const UploadHeaders = {
    'Authorization': `apikey ${SyncsketchConfig.user}:${SyncsketchConfig.token}`,
}

export class SyncsketchService {
    static MissingSyncsketchProject = { error: 'Project Not Found!' }

    static Query$ = (addr) => {
        const start = moment();
        return ajax.get(addr, QueryHeaders).pipe(
            tap(t => {
                const end = moment();
                console.log(`Syncsketch -- Query Fetch Time ${end.diff(start, 'seconds')} seconds`)
            }),
            map(result => result.response),
            take(1) 
        )
      }

    static RenameItem$ = (itemId, name) => {

    }

    static UploadItems$ = (reviewId, files, artist) => {
        const progressSubscriber = new Subject();
        const request$ = of(files).pipe(
            concatAll(),
            switchMap(f => {
                const formdata = new FormData();
                console.log(f.name, f);
                formdata.append("reviewFile", f, f.name);
                formdata.append("artist", artist);
                formdata.append("description", "item description");
                
                return ajax({
                    url: SyncsketchPosts.UploadFile(reviewId),
                    method: 'POST',
                    headers: UploadHeaders,
                    body: formdata,
                    crossDomain: true
                    //progressSubscriber,
                })
            }),
            tap(console.log),
        ).subscribe(res => console.log(res))
    }

    static AllProjects$ = SyncsketchService.Query$(SyncsketchQueries.ActiveProjects).pipe(
        map(response => response.objects),
        take(1)
    )

    static FindProject$ = (name) => SyncsketchService.AllProjects$.pipe(
        map(projects => _.find(projects, p => p.name.indexOf(name) > -1)),
        map(project => project ? project : SyncsketchService.MissingSyncsketchProject)
    )

    static FindReview$ = (name, ssGroupId) => 
    {
        console.log("Searching Reviews for: ", name, ssGroupId);
        const addr = SyncsketchQueries.ReviewsByName(name);
        console.log(addr);
        return SyncsketchService.Query$(addr).pipe(
            take(1),
            map(response => {
                const {total_count, limit} = response.meta;
                console.log(`Syncsketch -- returned ${total_count} with ${limit} limit`);
                return response.objects.filter(r => r.group == ssGroupId);
            }),
        );
    }
    
    static ItemById$ = (id) => SyncsketchService.Query$(SyncsketchQueries.ItemById(id));

    static AllUsers$ = SyncsketchService.Query$(SyncsketchQueries.AllUsers).pipe(
        tap(t => console.log(t)),
        map((account) => account.connections),
        map((connections) => _.map(connections, c=> c.user)),
      )  
      
    static AllFeedback$ = (id) => SyncsketchService.Query$(SyncsketchQueries.AllFeedback(id)).pipe(
        map(result => result.objects)
    );
}