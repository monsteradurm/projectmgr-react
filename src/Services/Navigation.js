import { BehaviorSubject, map, shareReplay } from "rxjs";

const PrimaryColors = {
    'Projects' : '#008577',
    'default' : 'gray'
}
export class NavigationService {
    static _Titles$ = new BehaviorSubject([]);
    static Titles$ = NavigationService._Titles$.asObservable().pipe(shareReplay(1));

    static Primary$ = NavigationService.Titles$.pipe(
        map(titles => titles && titles.length > 0 ? 
            PrimaryColors[titles[0]] : PrimaryColors['default']),
        map(color => color ? color : PrimaryColors['default'] ),
        shareReplay(1)
    )

    static SetTitles(arr) {
        NavigationService._Titles$.next(arr);
    }
}