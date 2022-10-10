import { BehaviorSubject, concatMap, finalize, from, map, Observable, of, 
    retry, shareReplay, switchMap, take, takeWhile, tap, timer, toArray } from "rxjs";
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
        return MondayService.Execute$(mutation)
    }

    static AllUsers$ = () => MondayService.Execute$(
        MondayGraphQL.Query_AllUsers()
    ).pipe(
      map(result => result.users),
      take(1)
    )

    static AddSubitem = (itemId, name, index, reviewIndex, link, department, artist, timeline) => {
      console.log("ADD SUB ITEM", itemId, name, index, reviewIndex, link, department, artist, timeline);
      return MondayService.Execute$(MondayGraphQL.Create_SubItem(itemId, name)).pipe(
        map(response => {
          if (!response.create_subitem){
            ToastService.SendError("Could not create subitem. Please contact your Technical Director.")
            throw 'Error creating subitem';
          }

          return response.create_subitem;
        }),
        switchMap(item => {
          
          const boardId = item.board.id;
          const columns = item.column_values;
          const depCol = _.find(columns, (c) => c.title === 'Feedback Department');
          const linkCol = _.find(columns, (c) => c.title === 'Link');
          const artistCol = _.find(columns, (c) => c.title === 'Artist');
          const timelineCol = _.find(columns, (c) => c.title === 'Timeline');
          const indexCol = _.find(columns, (c) => c.title === 'Index');
          const reviewCol = _.find(columns, (c) => c.title === 'Review');

          const values = {};
          values[depCol.id] = { labels: [department] };
          values[linkCol.id] = link;
          values[indexCol.id] = index.toString();
          values[reviewCol.id] = reviewIndex.toString();

          if (artist && artist.length > 0)
            values[artistCol.id] = { 
              personsAndTeams: artist.map(a => ({id: a, kind: "person"}))
            };

          if (timeline) {
            values[timelineCol.id] = {from:timeline[0], to:timeline[1]}
          }

          const mutation = MondayGraphQL.Mutate_Columns(boardId, item.id, values);
          console.log(mutation);
          return MondayService.Execute$(mutation);
        })
      )
    }

    

    static RenameSubitem = (subitemId, name) => {

    }

    static ArchiveItem$ = (itemId) => {
      return MondayService.Execute$(
        MondayGraphQL.ArchiveItem(itemId)
      )
    }

    static QueryTag$ = (entry) => MondayService.Execute$(MondayGraphQL.Query_TagId(entry)).pipe(
        tap(console.log),
        map(response => response.create_or_get_tag?.id ? response.create_or_get_tag.id : null),
        take(1)
      )

    static AddItemBadge = (boardId, itemId, columnId, badges, entry, id) => {
      const Tag$ = id ? of(id) : MondayService.QueryTag$(entry);
      

      return Tag$.pipe(
        map(tag => tag ? { "tag_ids" : _.pluck(badges, 'id').concat([tag]) } : null),
        map(v => v ? MondayGraphQL.Mutate_TagsColumn(boardId, itemId, columnId, v) : null),
        switchMap(mutation => mutation ? MondayService.Execute$(mutation)  : of(null)),
      )
    }

    static RemoveItemBadge = (boardId, itemId, columnId, badges, entry, id) => {
      const arr = _.pluck(badges, 'id').filter(i => i != id);
      return MondayService.Execute$(
        MondayGraphQL.Mutate_TagsColumn(boardId, itemId, columnId, {"tag_ids" : arr})
      )
    }
    

    static StoreUpdate$ = (id, content) => {
      const mutation = MondayGraphQL.Mutate_Update(id, JSON.stringify(content).slice(1, -1));
      console.log(mutation)
      return MondayService.Execute$(mutation);
    }

    static MutateDate = (boardId, itemId, columnId, date) => {
      const mutation = MondayGraphQL.Mutate_DateColumn(boardId, itemId, columnId, date);


      return MondayService.Execute$(mutation).pipe(
      )
    }

    static MutateTimeline = (boardId, itemId, columnId, from, to) => {
      const mutation = MondayGraphQL.Mutate_TimelineColumn(boardId, itemId, columnId, from, to);

      console.log(mutation);
      return MondayService.Execute$(mutation).pipe(
      )
    }

    static MutatePeople = (boardId, itemId, columnId, ids) => {
      const mutation = MondayGraphQL.Mutate_PeopleColumn(boardId, itemId, columnId, ids);

      console.log(mutation);
      return MondayService.Execute$(mutation).pipe(
      )
    }

    static Query_BoardId = (itemId) => MondayService.Execute$(
      MondayGraphQL.Query_BoardId(itemId)
        ).pipe(
          map(response => response?.items ? response.items : null ),
          map(items => items && items.length > 0 ? items[0].board.id : null)
      )

    static ItemDescription = (id) => {
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
    

    static MutateTags = (boardId, itemId, columnId, tags) => {
      console.log({boardId, itemId, columnId, tags})
      if (tags.length < 1)
        return MondayService.Execute$(MondayGraphQL.Mutate_TagsColumn(
            boardId, itemId, columnId, { "tag_ids" : [] }
          ).pipe(take(1))
        );

      return from(tags).pipe(
        concatMap(t => MondayService.Execute$(MondayGraphQL.Query_TagId(t)).pipe(
          map(res => res.create_or_get_tag.id)
        )),
        take(tags.length),
        toArray(),
        tap(t => console.log(MondayGraphQL.Mutate_TagsColumn(
          boardId, itemId, columnId, {"tag_ids": t}
        ))),
        switchMap(ids => MondayService.Execute$(MondayGraphQL.Mutate_TagsColumn(
            boardId, itemId, columnId, {"tag_ids": ids}))
          .pipe(
            take(1)
          )
        )
      )
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

    
    static ParseSupportBoard = (board, label) => {
        let groups = board?.groups ? board.groups : [];
        const settings = board?.columns ? board.columns : [];
  
        groups = _.sortBy(groups, g => g.title);
        const other = _.find(groups, g => g.title === 'Other');
  
        if (other) 
          groups = [...groups.filter(g => g.title !== 'Other'), other];
  
        return {label, id: board?.id, groups, settings}
      }
  

    static get Support_ManagementGroups$() {
      return MondayService.Execute$(
          MondayGraphQL.Support_ManagementGroups
        ).pipe(
          map(response => response?.boards ? response.boards : null),
          map(boards => boards && boards.length > 0 ? MondayService.ParseSupportBoard(boards[0], 'Management') : null)
          )
      }

    static get Support_SoftwareGroups$() {
      return MondayService.Execute$(
          MondayGraphQL.Support_SoftwareGroups
        ).pipe(
          map(response => response?.boards ? response.boards : null),
          map(boards => boards && boards.length > 0 ? MondayService.ParseSupportBoard(boards[0], 'Software') : null)
        )
    }

    static get Support_TechnicalGroups$() {
      return MondayService.Execute$(
          MondayGraphQL.Support_TechnicalGroups
        ).pipe(
          map(response => response?.boards ? response.boards : null),
          map(boards => boards && boards.length > 0 ? MondayService.ParseSupportBoard(boards[0], 'Technical') : null),
        )
    }

    static Support_Tickets$ = (boardId, groupId) => {
      return MondayService.Execute$(
        MondayGraphQL.SupportTickets(boardId, groupId)
      )
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

      static ManagementTeam$ = MondayService.Execute$(MondayGraphQL.ManagementTeam).pipe(
        take(1),
        map(t => t?.teams ? t.teams : []),
        map(teams => teams.length > 0 ? teams[0] : ({users: []})),
        map(team => team?.users ? team.users : []),
        tap(t => console.log("MANAGEMENT TEAM", t))
      )
}