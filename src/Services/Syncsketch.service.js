import { ajax } from "rxjs/ajax";
import { httpOptions, SyncsketchConfig, SyncsketchQueries } from "../Environment/Syncsketch.environment";
import * as _ from 'underscore';
import { take, map, tap } from "rxjs";
import moment from 'moment'
const QueryHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Authorization': `apikey ${SyncsketchConfig.user}:${SyncsketchConfig.token}`}
export class SyncsketchService {
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

    static ReviewsByName$ = (name) => this.Query$(SyncsketchQueries.ReviewsByName(name)).pipe(
        map(response => {
            const {total_count, limit} = response.meta;
            console.log(`Syncsketch -- returned ${total_count} with ${limit} limit`);
            return response.objects
        }),
    );
    
    static ItemById$ = (id) => this.Query$(SyncsketchQueries.ItemById(id));

    static AllUsers$ = this.Query$(SyncsketchQueries.AllUsers).pipe(
        tap(t => console.log(t)),
        map((account) => account.connections),
        map((connections) => _.map(connections, c=> c.user)),
      )  
      
    static AllFeedback$ = (id) => this.Query$(SyncsketchQueries.AllFeedback(id)).pipe(
        map(result => result.objects)
    );
}