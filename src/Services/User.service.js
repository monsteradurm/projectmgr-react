import { catchError, of, shareReplay, map, tap, take, switchMap, EMPTY } from "rxjs";
import { ajax } from "rxjs/ajax";
import { fromFetch } from "rxjs/fetch"
import { ApplicationObservables } from "../Components/Context/Application.context";
export class UserService {
    static UserPhotos = {};

    static UserPhoto$ = (id) => {
        if (!id) return of(null);
        
        if (UserService.UserPhotos[id]) 
            return of(UserService.UserPhotos[id]);

        return ApplicationObservables.AuthToken$.pipe(
            switchMap(token => token ? of(token) : EMPTY),
            switchMap(token =>
                fromFetch(
                    `https://graph.microsoft.com/v1.0/users/${id}/photo/$value`, {headers: {
                        'Authorization': `Bearer ${token}`
                        }, observe: 'body', responseType: 'blob'
                    }).pipe(
                        switchMap(response => response.blob()),
                        map(blob => window.URL.createObjectURL(blob)),
                        catchError(err => {
                            return of(null);
                        })
                    )
                ),
                take(1),
                tap((photo) => {
                    if (photo) UserService.UserPhotos[id] = photo;
                    console.log(photo);
                })
        )
    }
}