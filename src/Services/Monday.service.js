import { BehaviorSubject, finalize, map, Observable, of, 
    retry, shareReplay, switchMap, take, takeWhile, tap, timer } from "rxjs";
import { MondayConfig, MondayGraphQL } from "../Environment/Monday.environment";
import * as _ from 'underscore';
import mondaySdk from 'monday-sdk-js';
import { ToastService } from "./Toast.service";
import { RandomRGB } from "../Helpers/Colors.helper";

const monday = mondaySdk();
monday.setToken(MondayConfig.token);
export class MondayService {

    static Toaster = null;

    static _IsReachable = new BehaviorSubject(true);
    static IsReachable$ = MondayService._IsReachable.asObservable().pipe(shareReplay(1));

    static _ComplexityExhausted = new BehaviorSubject(null);
    static ComplexityExhausted$ = MondayService._ComplexityExhausted.asObservable();

    static SetItemStatus = (boardId, itemId, columnId, statusIndex) => {
        const mutation = MondayGraphQL.Mutate_SimpleColumn(boardId, itemId, columnId, statusIndex);
        MondayService.Execute$(mutation).pipe(take(1)).subscribe((t) => {
            ToastService.SendSuccess('Status Updated')
        })
    }

    static AllUsers$ = () => MondayService.Execute$(
        MondayGraphQL.Query_AllUsers()
    ).pipe(
      map(result => result.users),
      take(1)
    )

    static SetItemTags = (boardId, itemId, columnId, tags) => {

    }
    
    static AddTagOption = (label) => {

    }

    static AllTags = () => MondayService.Execute$(
        MondayGraphQL.Query_AllTags()
    ).pipe(
        map(result => _.map(result.tags, 
                (t) => (   {...t, color: RandomRGB()}  )
            )
        ),
        map(result => _.reduce(result, (acc, t) => {
            acc[t.name] = t;
            return acc;
        }, {})),
        take(1)
    )
    static ColumnSettings = (boardId) => MondayService.Execute$(
        MondayGraphQL.Query_ColumnSettings(boardId)
    ).pipe(
        switchMap(result => of(result.boards[0].columns) ),
        map(cols => _.reduce(cols, (res, v) => {
            if (v['settings_str'] === '{}')
                return res;

            res[v['title']] = JSON.parse(v.settings_str)
            res[v['title']].id = v.id;
            return res;
        }, {})),
        take(1)
    )

    static IsComplexityError = (errors) => {
        if (!errors || errors.length < 1)
          return;
        console.log(errors);
        let error = _.find(errors, e => e.message && e.message.toLowerCase().indexOf('complexity') > -1)
        if (!error) {
          throw (errors);
        }
        let messageArr = error.message.split(' ')
        return parseInt(messageArr.splice(messageArr.length - 2, 1));
      }

    static Execute$ = (cmd) => {
        return new Observable(observer => {
          monday.api(cmd).then((res) => {
            let cError = MondayService.IsComplexityError(res?.errors);
            if (cError) {
              
              timer(0, 1000).pipe(
                takeWhile(t => cError > 0)
              ).subscribe(() => {
                MondayService._ComplexityExhausted.next(cError.toString())
                cError -= 1;
                if (cError === 0)
                  observer.error({ retry: true })
              })
            }
    
            else if (res?.errors)
              observer.error([res.errors, cmd]);
    
            else if (!res.data)
              observer.error('No Data!');
    
            else {
              observer.next(res?.data);
              observer.complete();
            }
          })
        }).pipe(
          retry(),
          finalize(() => {
            MondayService._ComplexityExhausted.next(null);
          })
        )
      }
}