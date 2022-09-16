import { catchError, of, EMPTY } from "rxjs";
import { map, tap, take, switchMap, expand, reduce } from 'rxjs/operators';
import { ajax } from "rxjs/ajax";
import { fromFetch } from "rxjs/fetch"
import { GraphEndpoints } from "@Environment/Graph.environment";

// --- Fetch all Users from Active Directory ---
const FetchAllUsers$ = (token) => ajax.get(GraphEndpoints.users, {Authorization: 'Bearer ' + token}).pipe(
    catchError(t => {
        console.log(t)
        return EMPTY
    }),
    expand((result, i) => result.response['@odata.nextLink'] ? 
        ajax.get(result.response['@odata.nextLink'], {Authorization: 'Bearer ' + token}) : EMPTY),
    reduce((acc, result) => {
        return acc.concat(result.response.value);
        }, []),
)

const Me$ = (auth) => ajax.get(GraphEndpoints.me, {Authorization: 'Bearer ' + auth.token}).pipe(
    map(result => result.response),
    take(1)    
)

const UserPhoto$ = (userId, token) => {
    if (!userId || !token) return of(null);

    return fromFetch(
        `https://graph.microsoft.com/v1.0/users/${userId}/photo/$value`, {headers: {
            'Authorization': `Bearer ${token}`
            }, observe: 'body', responseType: 'blob'
        }).pipe(
            switchMap(response => 
                response?.status === 200 ? response.blob() : of(null)),
            map(blob => blob ? window.URL.createObjectURL(blob) : null),
            catchError(err => {
                return of(null);
            }),
            take(1),
    )
}


export {
    UserPhoto$,
    FetchAllUsers$,
    Me$
};