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

    static AddItemBadge = (boardId, itemId, columnId, badges, entry, id) => {
      const Tag$ = id ? of(id) : MondayService.Execute$(MondayGraphQL.Query_TagId(entry)).pipe(
        map(response => response.create_or_get_tag?.id ? response.create_or_get_tag.id : null),
        take(1)
      )

      Tag$.pipe(
        map(tag => tag ? { "tag_ids" : _.pluck(badges, 'id').concat([tag]) } : null),
        map(v => v ? MondayGraphQL.Mutate_TagsColumn(boardId, itemId, columnId, v) : null),
        switchMap(mutation => mutation ? MondayService.Execute$(mutation)  : of(null)),
      ).subscribe((response) => {
      
        if (response)
          ToastService.SendSuccess(entry + 'Badge Added')
        else 
          ToastService.SendError("Could Not Add Badge: " + entry)
    })
    }
    //: "{\"tag_ids\":[15202572]}"
    
    static ItemUpdates = (id) => {
      return MondayService.Execute$(MondayGraphQL.Query_ItemUpdates(id)).pipe(
        map((response) => response?.items ? response.items : null),
        map((items) => items && items.length > 0 ? items[0] : null),
        map(item => item?.updates ? item.updates : null),
        map(updates => updates && updates.length > 0 ? 
          _.filter(updates, (u) => u.text_body.startsWith('Description:')) : null),
        map(updates => updates && updates.length > 0 ? updates[0] : null),
        map(update => update?.body ? update.body : null),
        tap(description => description ? description.replace('Description:', '') : null),
        take(1)
      )
    }
    static RemoveItemBadge = (boardId, itemId, columnId, badges, entry, id) => {
      const arr = _.pluck(badges, 'id').filter(i => i != id);
      return MondayService.Execute$(
        MondayGraphQL.Mutate_TagsColumn(boardId, itemId, columnId, {"tag_ids" : arr})
      ).subscribe((response) => {
        if (response)
          ToastService.SendSuccess('"' + entry + '"' + 'Badge Removed');
        else 
          ToastService.SendError("Could Not Remove Badge: " + entry);
      });
    }

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