import { catchError, map, of, switchMap, take, tap } from "rxjs"
import { ajax } from "rxjs/ajax";
import { TypeformConfig, TypeformEndPoints } from "../Environment/Typeform.environment";
import * as _ from 'underscore';
import moment from 'moment';
import { fromFetch } from "rxjs/fetch";

const httpOptions = {
    'Accept': 'application/json, text/plain, */*',
      'Content-Type':  'application/json',
      'Authorization': `Bearer ` + TypeformConfig.token
};

export class TypeformService {
    static Delete$ = (address) => {
        return ajax.delete(address, httpOptions).pipe(
          take(1)
        )
    }
    
    static Query$ = (address) => {
        return ajax.get(address, httpOptions).pipe(
          map(res => res?.response),
          take(1)
        )
    }

    static Forms$ = this.Query$(TypeformEndPoints.Forms).pipe(
        map(res => res?.items),
        map(items => items ? _.sortBy(items, i => i.title) : null),
        take(1)
    )

    static Responses$ = (id) => TypeformService.Query$(TypeformEndPoints.Responses(id)).pipe(
        tap(console.log),
        map(res => res?.items ? res.items: []),
        map(responses => responses.map(r => {
            const submitted = moment(r.submitted_at).format('MMM DD, YYYY')
            return {...r, submitted}
        })),
        take(1)
    );

    static Download$ = (address) => {
        return fromFetch(
            address.replace('https://api.typeform.com', '/typeform'), {...httpOptions, 
                'Content-Type': 'application/octet-stream',
                observe: 'body', responseType: 'blob'
            }).pipe(
                switchMap(response => 
                    response?.status === 200 ? response.blob() : of(null)),
                map(blob => blob ? window.URL.createObjectURL(blob) : null),
                catchError(err => {
                    return of(null);
                }),
                take(1),
        )
        /*
        return this.http.get<Blob>(address, {
          headers: new HttpHeaders({
            'Content-Type': 'application/octet-stream',
            'Authorization': `Bearer HvEbs4iKz83jcpTLNcFbMc3S6FtpkEXBoKNmRQaDXzeE`,
          }),
          observe: 'body', responseType: 'blob' as 'json'
        }).pipe(
          map((data:Blob) => {
            var url = window.URL.createObjectURL(data);
            window.open(url, '_blank', '');
          }),
          take(1)
        )
        */
      }

    RetrieveFile$(form_id, response_id, answer) {
        return TypeformService.Download$(TypeformEndPoints.RetrieveFile(form_id, response_id, answer));
      }
    
      RemoveResponse$(form_id, response_id) {
        return TypeformService.Delete$(TypeformEndPoints.RemoveResponse(form_id, response_id));
      }
    
      Webhooks$(id) {
        return TypeformService.Query$(TypeformEndPoints.Webhooks(id));
      }
}