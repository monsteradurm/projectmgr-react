export class NavigationService {
    static _Titles$ = new BehaviorSubject([]);
    static Titles$ = NavigationService._Titles$.asObservable().pipe(shareReplay(1));

    static SetTitles(arr) {
        NavigationService._Titles$.next(arr);
    }
}