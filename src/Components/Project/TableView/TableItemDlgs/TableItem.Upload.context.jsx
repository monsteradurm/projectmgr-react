import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { catchError, combineLatest, concatMap, EMPTY, from, map, merge, of, scan, startWith, switchMap, takeUntil, tap, withLatestFrom } from "rxjs";
import { BoardItemDepartment$, BoardItemName$ } from "../../Context/Project.Item.context";
import { SyncsketchItems$, SyncsketchGroup$, SyncsketchProject$, syncsketchReviewDepartments$, useSyncsketchReviewDepartments } from "../../Context/Project.Syncsketch.context";
import * as _ from 'underscore';
import { Department$, Group$ } from "../../Context/Project.Objects.context";
import { SendToastError, SendToastInfo, SendToastSuccess, SendToastWarning } from "../../../../App.Toasts.context";
import { LoggedInUser$ } from "../../../../App.Users.context";
import { SyncsketchService } from "../../../../Services/Syncsketch.service";


export const [showUploadReviewDlgEvent$, ShowUploadReviewDialog] = createSignal((id) => ({id}));
export const [useUploadReviewDlg, UploadingBoardItemId$] = bind(
    showUploadReviewDlgEvent$.pipe(
        map(result => result?.id),
        tap(() => ResetUploadSteps())
    ), null
)

const _mapFilter = (f) => f;
export const [ReviewGroupChanged$, SetReviewGroupSelection] = createSignal(_mapFilter);
export const [useReviewGroupSelection, ReviewGroupSelection$] = bind(
    ReviewGroupChanged$, null
)

export const [UploadInputItemNameChanged$, SetUploadInputItemName] = createSignal(_mapFilter);
export const [useUploadInputItemName, UploadInputItemName$] = bind(
    UploadInputItemNameChanged$, ''
)



export const [NewDepartmentNameChanged$, SetNewDepartmentName] = createSignal((n) => n);

export const [useNewDetpartmentName, NewDepartmentName$] = bind(
    NewDepartmentNameChanged$, ''
)

export const [useUploadReviewGroup, UploadReviewGroup$] = bind(
    ReviewGroupSelection$.pipe(
        switchMap(group => group === 'New' ? NewDepartmentName$ : of(group))
    ), null
)


export const [, ReviewDlgElement$] = bind(
    showUploadReviewDlgEvent$.pipe(
        switchMap(({id}) => id === null ? of(null) :
            BoardItemName$(id).pipe(
                map(name => {
                    if (name === SUSPENSE)
                        return SUSPENSE;
                    else if (name === null)
                        return null;

                    return name[0] // [Element, Task]
                })
            )
        )
    )    
)
export const [useSyncsketchReviewName, SyncsketchReviewName$] = bind(
    combineLatest([Group$, ReviewDlgElement$,  UploadReviewGroup$]).pipe(
        switchMap(([group, element, reviewGroup]) => 
            [group, element, reviewGroup].indexOf(SUSPENSE) < 0 ?
            of(`${group?.title}/${element} (${reviewGroup})`)
            : EMPTY
        ),
    ), null
)

const DefaultReviewGroups = ['Internal', 'Client', 'Franchise'];
export const [useReviewGroupOptions, ReviewGroupOptions$] = bind(
    ReviewDlgElement$.pipe(
        switchMap(element => {
            if (element === SUSPENSE)
                return of(SUSPENSE);
            else if (element === null)
                return of(null);

            return syncsketchReviewDepartments$(element)
        }),
        map( groups => !groups || groups === SUSPENSE ? 
            DefaultReviewGroups : _.uniq(groups.sort().concat(DefaultReviewGroups))),
        map(groups => groups.concat(['New']))
    ), DefaultReviewGroups.concat(['New'])
)

export const UploadSteps = [
    {label: 'Select Feedback Department', index: 0},
    {label: 'Define Review Name', index: 1},
    {label: 'Select Content', index: 2},
    {label: 'Upload', index: 3}
]

//accept either a label (return appropriate index from UploadSteps) or an index directly.
export const [CurrentUploadStepChanged$, SetCurrentUploadStep] = createSignal(n => n);

export const [UploadSyncsketchReviewChanged$, SetUploadSyncsketchReview] = createSignal((review) => review);

export const [useUploadSyncsketchReview, UploadSyncsketchReview$] = bind(
    UploadSyncsketchReviewChanged$, null
)

export const[useUploadedSyncsketchItems, UploadedSyncsketchItems$] = bind(
    UploadSyncsketchReview$.pipe(
        switchMap((review) => {
            if (!review?.uuid || review === SUSPENSE)
                return EMPTY

            return of(review.uuid);
        }),
        switchMap(reviewId => SyncksetchItems$(reviewId))
    )
)

export const [useSyncsketchDepartment, SyncsketchDepartment$] = bind(
    UploadingBoardItemId$.pipe(
        switchMap(id => {
            if (id === null || id === SUSPENSE)
                return of(null);
            
            return BoardItemDepartment$(id);
        })
    ), SUSPENSE
)


const padToThree = (n) => n <= 999 ? `00${n}`.slice(-3) : n;
const padToTwo = (n) => n <= 99 ? `0${n}`.slice(-2) : n;

export const [useSyncsketchNextItemIndex, SyncsketchNextItemIndex$] = bind(
    combineLatest([UploadedSyncsketchItems$, SyncsketchDepartment$]).pipe(
        map(([items, department]) => _.filter(items, i => i.name.indexOf(department) >= 0)),
        map(items => _.pluck(items, 'name')),
        map(names => _.filter(names, n => n.indexOf(' ') >= 0)),
        map(names => _.map(names, n => n.split(' ')[1])),
        map(indices => _.reduce(indices, (acc, i) => {
            try { acc.push(parseInt(i)); }
            catch { return acc; }
            return acc;
        }, [])),
        map(indices => _.max(indices)),
        map(index => index + 1),
        map(index => padToThree(index)),
        catchError(err => of('001')),
    ), SUSPENSE
)
export const [useUploadItemName, UploadItemName$] = bind(
    combineLatest([UploadInputItemName$, SyncsketchNextItemIndex$, SyncsketchDepartment$]).pipe(
        map(([name, index, department]) => {
            if ([name, index, department].indexOf(SUSPENSE) >= 0)
                return EMPTY
            
            return `${department} ${index} ${name}`
        })
    ), null
)


//set the index back to 0
export const [ResetUploadStepEvent$, ResetUploadSteps] = createSignal();

export const [useCurrentUploadStepIndex, CurrentUploadStepIndex$] = bind(
    merge(
        CurrentUploadStepChanged$.pipe(map(i => ({value: i, type: 'set'}))), 
        ResetUploadStepEvent$.pipe(
            tap(() => {
                SetReviewGroupSelection('Internal'),
                SetNewDepartmentName('');
                SetUploadInputItemName('');
            }),
            map(() => ({value: 0, type: 'reset'})))
    ).pipe(
        map(step => {
            if (step.type === 'reset')
                return 0;

            if (typeof step.value !== "string")
                return step.value;

            const valid =  _.filter(UploadSteps, s => {
                return s.label === step.value
            });

            if (valid.length < 1)
                return 0;
            return valid[0].index;
        }),
        switchMap(index => index < 1 ? of(index) : UploadStepsReady$.pipe(
            switchMap(validSteps => {
                if (validSteps.indexOf(index) >= 0)
                    return of(index);
                
                
                switch (index) {
                    case 1: {
                        SendToastError('The \"Feedback Department\" is not Set!');
                        break;
                    }
                    case 2: {
                        SendToastError('The \"Review Name\" is not Set!');
                        break;
                    }
                    case 3: {
                        //SendToastError('Content has not been Set for Upload!');
                        break;
                    }
                }
                const bestIndex = _.last(validSteps);
                SetCurrentUploadStep(bestIndex);
                return of(bestIndex);
            })
        )),
    ), 0
)

export const [FilesAdded$, HandleFilesAdded] = createSignal((evt) => {
    if (!evt.target?.files)
        return;

    for(var i=0; i < evt.target.files.length; i++) {
        AddFileToUpload(evt.target.files[i]);
    }
})

export const [AddFileEvent$, AddFileToUpload] = createSignal(
    (file, type) => ({action: 'Add', file, type: type || 'Standard'})
);

export const [RemoveFileEvent$, RemoveFileFromUpload] = createSignal(
    (file) => ({action: 'Remove', file})
);

export const [RemoveFileCompleted$, RemoveFileCompleted] = createSignal(
    (file) => ({action: 'RemoveCompleted', file})
);

export const [ModifyFileEvent$, ModifyFileFromUpload] = createSignal(
    (file, type) => ({action: 'Modify', file, type})
);

export const [ClearFileEvent$, ClearFilesFromUpload] = createSignal(
    () => ({action: 'Clear'})
);

const handleFileThumbnail = (f) => {
    return URL.createObjectURL(f);
}

export const [useFilesForUpload, FilesForUpload$] = bind(
    merge(AddFileEvent$, RemoveFileEvent$, RemoveFileCompleted$, ModifyFileEvent$, ClearFileEvent$).pipe(
        tap(console.log),
        scan((acc, {action, file, type}) => {
            switch(action) {
                case 'Add':
                    return [...acc.filter(f => f.name !== file.name), {file, type: type || 'Standard', 
                        thumbnail: handleFileThumbnail(file)}]
                case 'Remove':
                    return [...acc.filter(f => f.file.name !== file.name)]
                case 'RemoveCompleted': {
                        const result = [...acc.filter(f => f.file.name !== file)]
                        if (result.length < 1) {
                            ShowUploadReviewDialog(null);
                            SendToastSuccess("All Files Uploaded Successfully");
                        }
                        return result;
                }
                case 'Clear':
                    return [];
                case 'Modify': {
                    const items = [...acc]
                    const item = _.find(items, f => f.file.name === file.name);
                    if (item)
                        item.type = type;
                    return items;
                }
            }
        }, []),
        tap(console.log)
    ), [],
)



export const [useUploadStepsReady, UploadStepsReady$] = bind(
    combineLatest([
        UploadSyncsketchReview$, UploadInputItemName$, FilesForUpload$
    ]).pipe(
        map(([review, itemName, files]) => {
            const validIndices = [0];

            if (!review)
                return validIndices;
            
            validIndices.push(1);
            if (!itemName || itemName.length < 5)
                return validIndices;
            
            validIndices.push(2);

            if (!files || files.length < 1)
                return validIndices;

            validIndices.push(3);
            return validIndices;
                
        }),
    )
)

export const [StartUploadEvent$, StartUploading] = createSignal((reviewId) => reviewId);
export const [CancelUploadEvent$, CancelUploading] = createSignal(() => ({type: 'cancel'}));

export const [useUploadEvent, OnUploadEvent$] = bind(
    StartUploadEvent$.pipe(
        withLatestFrom(FilesForUpload$, UploadItemName$, LoggedInUser$),
        switchMap(([reviewId, files, itemName, user]) => {
            const { displayName: artist} = user;
            const [department, index, name] = itemName.split(' ');

            if (files.length < 1) {                
                SendToastError('No files have been Added for Upload');
                throw 'No Files Added for Upload...'
            }
            
            //`${department} ${index} ${name}`
            SetCurrentUploadStep(UploadSteps.length - 1);
            const toUpload = files.map((f, i) => {
                const ext =  _.last(f.file.name.split('.'));
                const params = {
                    filename: files.length === 1 ? 
                        itemName + "." + ext : 
                        `${department} ${index}.${padToTwo(i)} ${name}.${ext}`,
                    artist
                };
                
                return {file: f.file, reviewId, params, index: i}
            });

            console.log("Uploading.. ", toUpload);
            return from(toUpload).pipe(
                concatMap(u => SyncsketchService.UploadItem$(u.reviewId, u.file, u.params, u.index, files.length).pipe(
                        tap(evt => SendUploadProgress(evt)),
                        takeUntil(CancelUploadEvent$.pipe(
                            tap(t => {
                                SendToastWarning("Uploads were Cancelled!");
                                SetCurrentUploadStep(2);
                            })
                        )),
                        tap(console.log),
                        
                    )
                )
            )
            
        }),
        catchError((err) => {
            console.log("Error Context: /OnUploadEvent", err);
            SendToastError("There was an error before Upload started...");
            return of(null)
        })
    ), null
)
//reviewId, file, param
const _uploadFileMap = (file, params) => ({file, params}); 
export const [UploadFileEvent$, UploadFile] = createSignal(_uploadFileMap);

const _uploadProgressEventMap = (evt) => (evt);
export const [UploadProgressEvent$, SendUploadProgress] = createSignal(_uploadProgressEventMap);

export const[useUploadProgressEvents, HandleUploadProgressEvent$] = bind(
    UploadProgressEvent$.pipe(
        tap(evt => console.log('Upload Progress:', evt.progress.toString() + '%', evt.index, evt.description, evt.item)),
    ), null
)