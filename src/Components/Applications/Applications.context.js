import { bind, SUSPENSE } from "@react-rxjs/core";
import { catchError, combineLatest, concatMap, EMPTY, map, merge, of, switchMap, tap } from "rxjs";
import { TypeformService } from "../../Services/Typeform.service";
import * as _ from 'underscore';
import { createSignal } from "@react-rxjs/utils";
import moment from 'moment';
import { FirebaseService } from "../../Services/Firebase.service";

const responseMap = (val, searchParams, setSearchParams) => {
    if (setSearchParams && searchParams) {
        searchParams.set('Response', val);
        setSearchParams(searchParams);
    }
    return val;
}

export const [SelectedResponseChanged$, SetSelectedResponseId] = createSignal(responseMap);
export const [useSelectedResponse, SelectedResponse$] = bind(
    SelectedResponseChanged$, ''
)

const responseSearchMap = (val, searchParams, setSearchParams) => {
    if (setSearchParams && searchParams) {
        searchParams.set('Search', val);
        setSearchParams(searchParams);
    }
    return val;
}

export const [ResponseSearchFilterChanged$, SetResponseSearchFilter] = createSignal(responseSearchMap);
export const [useResponseSearchFilter, ResponseSearchFilter$] = bind(
    ResponseSearchFilterChanged$, ''
)


export const ResponseSortByOptions = ['Name', 'Submitted', 'Experience', 'Rating', 'Comments']

export const [ResponseSortByChanged$, SetResponseSortBy] = createSignal(n => n);
export const [useResponseSortBy, ] = bind(
    ResponseSortByChanged$, 'Submitted'
)

export const [ResponseSortReversedChanged$, SetResponseSortReversed] = createSignal(n => n);
export const [useResponseSortReversed, ] = bind(
    ResponseSortReversedChanged$, false
)

export const [useApplicationForms, ApplicationForms$] = bind(
    TypeformService.Forms$.pipe(
        map(items => items ? items.map(i => {
            let nesting = ['Other', i.title];
            if (i.title.indexOf('/') > 0)
                nesting = i.title.split('/');
            return {...i, nesting} ;
        }) : null),
        catchError(err => of([]))
    ), []
)

export const [useApplicationGroups, ApplicationGroups$] = bind(
    ApplicationForms$.pipe(
        map(items => items ? _.groupBy(items, i => i.nesting[0]) : null),
        map(grouped => grouped ? Object.entries(grouped).map(g => ({group: g[0], forms: g[1]})) : []),
    ), []
)

export const [useApplication, Application$] = bind(
    id => 
        of(id).pipe(
            switchMap(id => id === SUSPENSE ? EMPTY :
                ApplicationForms$.pipe(
                    map(forms => id === SUSPENSE ? SUSPENSE : 
                        _.find(forms, f => f.id === id))
            )
        )
    ), SUSPENSE
)


export const [SelectedFormIdChanged$, SetSelectedFormId] =  createSignal(id => id);
export const [useSelectedFormId, ] = bind(
    SelectedFormIdChanged$, SUSPENSE
)

export const [, FetchApplicationResponses$] = bind(
    SelectedFormIdChanged$.pipe(
        switchMap(id => id && id !== SUSPENSE ? TypeformService.Responses$(id) : SUSPENSE),
    ), SUSPENSE
)

export const [, FetchApplicationResponseData$] = bind(
    SelectedFormIdChanged$.pipe(
        switchMap(id => id && id !== SUSPENSE ? FirebaseService.ApplicationResponseData$(id) : SUSPENSE)
    ), SUSPENSE
)

export const [useApplicationResponses, ApplicationResponses$] = bind(
    merge(combineLatest([FetchApplicationResponses$, FetchApplicationResponseData$]).pipe(
        map(([responses, data]) => {
                if (responses === SUSPENSE)
                    return SUSPENSE;

            if (data === SUSPENSE)
                data = {}
            
            return responses.map(r => {
                if (!data[r.response_id])
                    return {...r, ratings: {}, notes: []}
                
                const d = data[r.response_id]
                return {...r, ratings: d['ratings'], notes: d['notes']}
            })
        }),
    ), SelectedFormIdChanged$).pipe(
        map(result => Array.isArray(result) ? result : SUSPENSE)
    ), SUSPENSE
)

export const [useApplicationResponseMap, ] = bind(
    ApplicationResponses$.pipe(
        map(result => Array.isArray(result) ? _.reduce(result, (acc, r) => {
            acc[r.response_id] = r;
            return acc;
        }, {}) : SUSPENSE)
    ), SUSPENSE
)
const findAnswer = (response, field) => {
    const answers = response.answers;
    let answer = _.find(answers, a => a?.field?.ref === field);

    return answer;
}

export const useResponseName = (response) => {
    const answer = findAnswer(response, 'Fullname');
    return answer.text;
}

export const useResponseEmail = (response) => {
    const answer = findAnswer(response, 'Email');
    return answer.email;
}
export const useResponseLocation = (response) => {
    const answer = findAnswer(response, 'Location');
    return answer.text;
}

export const useResponseExperience = (response) => {
    const answer = findAnswer(response, 'YearsExperience');
    return answer.number;
}

export const useResponseWebsite = (response) => {
    const answer = findAnswer(response, 'Website');
    
    return answer?.url ? answer.url : null;
}

export const useResponsePhone = (response) => {
    const answer = findAnswer(response, 'Phone');
    return answer ? answer.phone_number : null;
}

export const useResponseCV = (response) => {
    const answer = findAnswer(response, 'CV');
    return answer?.file_url ? answer.file_url : null;
}

export const useResponseResume = (response) => {
    const answer = findAnswer(response, 'Resume');
    return answer?.file_url ? answer.file_url : null;
}

export const useResponseSubmitted = (response) => {
    return response.submitted;
}

export const useResponseComments = (response) => {
    return response?.notes ? response.notes : [];
}
export const useResponseRatings = (response) => {
    return response?.ratings ? Object.values(response.ratings) : []
}
export const useAverageRating = (response) => {
    const ratings = useResponseRatings(response);
    if (ratings.length < 1) return 0;

    return _.reduce(ratings, (acc, cur) => acc + cur, 0) / ratings.length / 2;
}

export const useResponseCommenter = (user, allUsers) => {
    console.log(user, allUsers);
    if (!allUsers[user])
        return '(User Removed)'
    return allUsers[user]?.monday?.name;
}