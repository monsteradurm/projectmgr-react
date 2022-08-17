import { FileUpload } from "primereact/fileupload";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useEffect, useState, useRef, useMemo, useContext, useCallback } from "react";
import { Stack } from "react-bootstrap";
import { InputText } from 'primereact/inputtext'
import "./UploadReview.component.scss"
import { ScrollPanel } from 'primereact/scrollpanel';
import { Button } from 'primereact/button';
import * as _ from 'underscore';
import { useBoolean, useInput, useNumber, useOnClickOutside } from "react-hanger";
import { ProjectItemContext } from "@Components/Project/ProjectItem/ProjectItem.component";
import { ProjectContext } from "@Components/Project/Overview.component";
import { SyncsketchService } from "@Services/Syncsketch.service";
import { ToastService } from "@Services/Toast.service";
import { ApplicationContext } from "@/Application.component"
import { Loading } from "@Components/General/Loading"
import { concatAll, concatMap, delay, EMPTY, forkJoin, from, map, merge, of, switchMap, take, tap } from "rxjs";
import { UploadProgress } from "./UploadProgress.component";
import { MondayService } from "../../../../Services/Monday.service";
import { ReviewItemName } from "../../../../Helpers/ProjectItem.helper";
const defaultReviewGroups = [
    {label: 'Internal'},
    {label: 'Client'},
    {label: 'Franchise'}
]
export const UploadReview = ({item, reviews, visibility, showUploadReviewDlg, 
        artist, timeline}) => {
    const [Uploads$, setUploads$] = useState(null);
    const [UploadsSubscription, setUploadsSubscription] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const itemContext = useContext(ProjectItemContext);
    const projectContext = useContext(ProjectContext);
    const appContext = useContext(ApplicationContext)
    const [ReviewGroup, setReviewGroup] = useState(null);
    const [reviewGroups, setReviewGroups] = useState([]);

    const ValidReviewGroup = useBoolean(false);
    const ValidReviewName = useBoolean(false);
    const ReviewIndex = useNumber(1);

    const NewReviewGroup = useInput('');
    const ReviewName = useInput('');
    const [syncsketchReview, setSyncsketchReview] = useState(null);
    const [syncsketchGroup, setSyncsketchGroup] = useState(null);
    const [itemTypes, setItemTypes] = useState({});
    const [files, setFiles] = useState([]);
    const fetchingSyncsketch = useBoolean(false);
    const uploader = useRef();
    const dialog = useRef();

    const { User } = appContext;
    const { Element, Artist } = itemContext.item;
    const { Group, SyncsketchProject, Board } = projectContext.objects;
    const newNameRef = useRef();
    const UploadsHandler = (evt) => {
        const files = evt.files;
        setUploads$(
            SyncsketchService.UploadItems$(syncsketchReview.id, 
            item.Department.text, ReviewIndex.value, ReviewName.value, files, User.displayName)
        )
    }

    useEffect(() => {
        if (Uploads$ === null && UploadsSubscription !== null) {
            console.log("UNSUBSCRIBING FROM UPLOADS$")
            of(null).pipe(
                delay(2000),
                take(1))
            .subscribe(() => {
                    UploadsSubscription.unsubscribe();
                    setUploadsSubscription(null);
                    setUploadProgress(null);
                    ToastService.SendSuccess("Items Successfully Uploaded")
                    closeDlg()
            })
            return;
        }

        else if (Uploads$ === null)
            return;
        
        else if (Uploads$ !== null && UploadsSubscription === null) {
            console.log("SUBSCRIBING TO UPLOADS$", Uploads$);

            setUploadsSubscription(
                from(Uploads$).pipe(
                    tap(console.log),
                    concatMap(upload => upload.$.pipe(
                        map(uploadEvent => ({
                                progress:       Math.round(100 * uploadEvent.loaded / uploadEvent.total),
                                index:          `${upload.index + 1}/${Uploads$.length}`,
                                description:    upload.orig,
                                item:           upload.item,
                                type:           uploadEvent.type,
                                complete:       upload.index + 1 >= Uploads$.length && uploadEvent.type === 'upload_load'
                            })
                        ),
                        tap(evt => console.log('Upload Progress:', evt.progress.toString() + '%', evt.index, evt.description, evt.item)),
                    ),
                ),
            ).subscribe(evt => {
                setUploadProgress(evt);

                if (evt.complete) {
                    setUploadProgress({
                        progress: null, index: null, item: 'Processing Syncsketch Items...'
                    })
                    
                        
                    SyncsketchService.ItemByName$(syncsketchReview.id, evt.item, true).pipe(
                        take(1)
                    ).subscribe((ssItem) => {
                        
                        setUploadProgress({
                            progress: null, index: null, item: 'Processing Monday Item...'
                        })

                        const subitemIndex = item.CurrentReview?.Index?.text ? 
                            parseInt(item.CurrentReview.Index.text) + 1 : 1;

                        let timelineArr = item.CurrentReview?.text && item.CurrentReview.text.indexOf(' - ') ? 
                            item.CurrentReview.text.split(' - ') : null;

                        if (!timelineArr && item.Timeline?.text && item.Timeline.text.indexOf(' - '))
                            timelineArr = item.Timeline.text.split(' - ');
                        
                        let reviewGroup = ReviewGroup.label;

                        if (reviewGroup === 'New')
                            reviewGroup = NewReviewGroup.value;

                        const link = syncsketchReview.reviewURL + '#/' + ssItem.id + '/'

                        MondayService.AddSubitem(
                            item.id,  ReviewName.value, item.subitems.length + 1, subitemIndex, link, 
                                reviewGroup, Artist ? Artist.map(a => a.monday.id) : null, timelineArr)
                                .pipe(
                                    take(1),
                                    tap(t => setUploadProgress({
                                        progress: null, index: null, item: 'Sorting Syncsketch Items...'
                                    })),
                                    switchMap(res => SyncsketchService.SortItems$(syncsketchReview.id))
                            ).subscribe(() => {
                                setUploads$(null);
                            })
                        })   
                    }
                })
            )
        }
    }, [Uploads$, UploadsSubscription])

    useEffect(() => {
        if (!Group || !ReviewGroup || !Element || !syncsketchGroup)
            return;

        else if (ReviewGroup.label == 'New' && NewReviewGroup.value.length < 1) {
            if (syncsketchReview !== null)
                setSyncsketchReview(null);
            return;
        }

        fetchingSyncsketch.setTrue();

        const group = ReviewGroup.label === 'New' ? NewReviewGroup.value : ReviewGroup.label;
        const title = `${Group.title}/${Element} (${group})`
        
        SyncsketchService.FindReview$(title, syncsketchGroup.uuid).subscribe((result) => {
            fetchingSyncsketch.setFalse();
            if (!result || result.length < 1) {
                if (syncsketchReview !== null)
                    setSyncsketchReview(null);

                return;
            }
            else if (result && result.length > 1)
            {
                ToastService.SendWarning('More than one Syncsketch Review matched Criteria for: ' + title)
            }
            
            setSyncsketchReview(result[0]);
            console.log("Syncsketch Review:", result[0])
        })
    }, [ReviewGroup, NewReviewGroup, Group, Element, syncsketchGroup])

    useEffect(() => {
        if (!SyncsketchProject)
            return;

        const ssGroup = _.find(SyncsketchProject.settings.groups.values, (g) => g.name == Board.name);

        console.log("Found Syncsketch Group: ", ssGroup);
        if (!ssGroup)
            return;

        setSyncsketchGroup(ssGroup);

    }, [SyncsketchProject])
    useEffect(() => {
        let reviewGroups = _.uniq(
            defaultReviewGroups
                .concat(Object.keys(reviews)
                    .filter(r => r && r.indexOf('All') < 0)
                    .map(r => ({label: r.replace(' Reviews', '')}))
            ), (g) => g.label
        )

        reviewGroups.push({label: 'New'});
        setReviewGroups(reviewGroups);
    }, [reviews])

    useEffect(() => {
        
        if (syncsketchReview === null || !ReviewGroup || !ReviewGroup.label) {
            ReviewIndex.setValue(1);
            return;
        }

        if (ReviewGroup.label === 'New' || !reviews[ReviewGroup.label + ' Reviews']){
            ReviewIndex.setValue(1);
            return;
        }

        ReviewIndex.setValue( reviews[ReviewGroup.label + ' Reviews'].length + 1 );

    }, [ReviewGroup, reviews, syncsketchReview]);

    const closeDlg = (evt) => {
        showUploadReviewDlg.setFalse();
    }

    const UploadItemTemplate = (file, options) => {

        return (
            <Stack direction="horizontal" style={{position:'relative', width: '100%'}} gap={3}>
                <div style={{width: '100px'}}>{options.previewElement}</div>
                <div style={{fontWeight: 600, width: '100%', textAlign: 'left',
                marginLeft: '20px'}}>{file.name}</div>
                <Dropdown inputId="ItemType" value={itemTypes[file.name]} options={
                    ['Standard', '360 Image', '360 Video'
                ]} 
                    placeholder="Standard"
                    scrollHeight={800}
                    onChange={(e) => {
                        file.uploadType = e.value;
                    }}
                    style={{width:'150px', right: 200, position: 'absolute'}}/>
                <div style={{right: '80px', position: 'absolute'}}>{options.sizeElement}</div>
                <div style={{position: 'absolute', right: '10px'}}>{options.removeElement}</div>
            </Stack>
        )
    }


    const DlgHeader = () => (
        <div className="pm-dialogHeader" style={{position: 'relative', background: 
            item.Status?.info?.color ? item.Status.info?.color : 'black'}}>
            <span>Upload Review:
                <span style={{marginLeft:'10px'}}>
                    {item.name.replace('/', ', ')}
                    <span style={{marginLeft:'10px'}}>({item.Department.text})</span>
                </span>
            </span>
            <Button icon="pi pi-times" style={{background: 'transparent', border:'none'}}
            className="p-button-rounded" aria-label="Cancel" 
            onClick={(e) => closeDlg()}/>
        </div>
    )

    const SyncsketchReviewControl = () => {
        if (syncsketchReview !== null)
            return null

        if (!ReviewGroup) return null;
        const group = ReviewGroup.label === 'New' ? NewReviewGroup.value : ReviewGroup.label;
        const title = `${Group.title}/${Element} (${group})`

        return (
        <Stack direction="horizontal" gap={3} className="pm-warning-text" 
            style={{marginTop: 0, marginLeft:10, padding:40}}>
            <Stack direction="vertical">
                <div><span style={{fontWeight:600}}>Warning!</span>
                    <span style={{marginLeft:15}}>
                        A Syncsketch Review could not be found for
                    </span>
                    <span style={{fontWeight:600, marginLeft: 5}}>{title}</span>
                </div>
                <div style={{marginTop: 30, color: 'black'}}>
                    If this is the first time a <span style={{fontWeight:600, marginLeft: 5}}>
                        "{group}"
                    </span> Review has been uploaded to Syncsketch for 
                    <span style={{fontWeight:600, marginLeft: 5}}>"{Element}"</span> this is expected
                </div>
                <div style={{marginTop: 10, color: 'black'}}>
                    You will need to "Create" a Syncsketch Review Link.
                </div>
            </Stack>
            <div className="ms-auto" />
            <Button label="Create Review" style={{marginTop:60}}/>
        </Stack>
        )
    }
    const FileLabelPreview = () => (
        <div  style={{marginBottom: '10px', paddingLeft: '40px', marginLeft: '10px', 
            color: 'gray', marginTop: '20px'}}>
            Files will be labelled: 
                <span style={{marginLeft: '10px', fontWeight: '600', color:'black'}}>
                    "{item.Department.text}
                    <span style={{marginLeft: 5}}>{String(ReviewIndex.value).padStart(3, '0')}</span>
                    <span style={{marginLeft: 5}}>{ReviewName.value}"</span>
                </span>
        </div>
    )

    const ReviewNameControl = () => {
        const textInput = useInput(ReviewName.value);
        if (!ValidReviewGroup.value) {
            ValidReviewName.setFalse();
            return null;
        }

        if (!ReviewGroup || ReviewGroup.label === null || !syncsketchReview) return null;
        else if (ReviewGroup.label === 'New' && !ValidReviewGroup.value) return null;

        const onChange = ((e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '')
            if (ValidReviewName.value) ValidReviewName.setFalse();
            textInput.onChange(e);
        })
        const Validate = (e) => {
            if (!e || e.length < 4) {
                ToastService.sendError("Review Name \"" + e + "\" is Not Valid!");
                return;
            } 
            ReviewName.setValue(e);
            ValidReviewName.setTrue();
        }
        return(
            <>          
                <Stack direction="horizontal" gap={3} style={{alignItems: 'baseline'}}>
                    <span className="p-float-label" style={{marginTop: '40px'}}>
                        <InputText key="NewReviewName" id="ReviewName" value={textInput.value}  
                            style={{width:'500px'}}
                            onChange={onChange}
                            placeholder="eg. Blocking, First Pass"/>

                        <label htmlFor="ReviewName">Review Name</label>
                    </span>
                    {
                        !ValidReviewName.value ?
                        <Button icon="pi pi-check" 
                                onClick={(e) => Validate(textInput.value)}
                                style={{ display: textInput.value.length > 3 ? null : 'none'}} />
                        : <Button icon="pi pi-check"
                                style={{background: 'rgb(23, 90, 99)'}} disabled />
                    }
                </Stack>
            </>    
        )
    }
    const onFileAdded = (evt) => {
        let updated = {...itemTypes};
        for(var f = 0; f < evt.files.length; f++) {
            const file = evt.files[f];
            console.log(file);
            updated[file.name] = 'Standard';
            toAdd.push(file);
        }

        setItemTypes(updated);
    }
    const NewReviewGroupControl = () => {
        const textInput = useInput(ReviewName.value);

        const onChange = ((e) => {
            if (ValidReviewGroup.value) ValidReviewGroup.setFalse();
            textInput.onChange(e);
        })

        const invalid = useMemo(() => {
            return reviewGroups ? reviewGroups : []
        }, [reviewGroups])

        if (ReviewGroup?.label !== 'New') return null;

        const Validate = (e) => {
            if (!e || e.length < 4) {
                ToastService.SendError('Feedback Department \"' + e + "\" is Not Valid")
                return;
            }

            ValidReviewGroup.setTrue();
            NewReviewGroup.setValue(e);
        }
        
        return (<Stack direction="horizontal" gap={3}>
                    <InputText id="NewReviewGroup" value={textInput.value}  
                            style={{width:'300px'}}
                            onChange={onChange}
                            placeholder="eg. Internal, Franchise, Client.." />
                    {
                        !ValidReviewGroup.value ? 
                        <Button icon="pi pi-check" 
                        onClick={(e) => Validate(textInput.value)}
                        style={{ display: textInput.value.length > 3 
                        && invalid.indexOf(textInput.value) < 0 ? null : 'none'}} />
                        : <Button icon="pi pi-check"
                        style={{background: 'rgb(23, 90, 99)'}} disabled />
                    }
                    
            </Stack>)
    }
    const FileUploadWarning = () => (
        <div style={{paddingLeft: '40px', marginBottom: '0px', 
            marginLeft: '10px', color: 'red', marginTop: '20px'}}>
            Uploading requires a<span style={{marginLeft:'10px', fontWeight: 600}}>"Feedback Department"</span>
            <span style={{marginLeft:'10px'}}>as well as a </span>
            <span style={{marginLeft:'10px', fontWeight: 600}}>"Review Name"</span>
        </div>
    )

    const FileUploadPreview = () => (
        <div  style={{marginBottom: '0px', paddingLeft: '40px',
            marginLeft: '10px', color: 'gray', marginTop: '0px'}}>
                Files will be uploaded to the
                <span style={{marginLeft: '10px', fontWeight: '600', color:'black'}}>
                    "{
                        ReviewGroup && ReviewGroup.label !== 'New' ? ReviewGroup.label : NewReviewGroup.value
                    }"
                </span>
                <span style={{marginLeft: '10px'}}>Review Link for this item.</span>
        </div>
    )

    const onReviewGroupChange = (e) => {
        if (e === 'New') {
            ValidReviewGroup.setFalse();
            setReviewGroup(e);
            return;
        }
        ValidReviewGroup.setTrue();
        setReviewGroup(e);
    }

    const displayLabelPreview = useMemo((() =>
        ReviewGroup && ReviewGroup.label && ReviewName.value ? null : 'none'
    ), [ReviewGroup, ReviewName.value])

    const UploadForm = () => {
        if (uploadProgress) return null;
        return (
            <>
                <div style={{padding:'40px', paddingBottom: '0px', fontSize: '16px', marginTop: '10px'}}>
                    <Stack direction="horizontal" gap={3}>
                        <span className="p-float-label">
                            <Dropdown inputId="ReviewGroup" value={ReviewGroup} options={reviewGroups} 
                                placeholder="eg. Internal or Client"
                                scrollHeight={800}
                                onChange={(e) => onReviewGroupChange(e.value)}
                                optionLabel="label" style={{width:'300px'}}/>
                            <label htmlFor="ReviewGroup">Feedback Department</label>
                        </span>
                        <NewReviewGroupControl />
                    </Stack>
                    {
                        fetchingSyncsketch.value ? null : <ReviewNameControl />
                    }     
                </div>
                {
                    fetchingSyncsketch.value ? null :
                    <>          
                    {      
                        ValidReviewGroup.value && ValidReviewName.value && syncsketchReview ? 
                        <div>
                            <FileLabelPreview />
                            <FileUploadPreview />
                        </div> : null
                    }
                    <div style={{display: syncsketchReview && ReviewName.label < 1 ? null : 'none'}}>
                        <FileUploadWarning />
                    </div>
                    </>
                }
                {
                    !fetchingSyncsketch.value && !syncsketchReview && ValidReviewGroup.value?
                    <SyncsketchReviewControl />  : null
                }
                {
                    !!syncsketchReview && ValidReviewGroup.value && ValidReviewName.value && !fetchingSyncsketch.value ? 
                    <FileUpload itemTemplate={UploadItemTemplate} multiple
                    onSelect={onFileAdded}
                    files={files}
                    customUpload={true} uploadHandler={UploadsHandler}
                    ref={uploader}/>
                    : null
                }
                {
                    fetchingSyncsketch.value ? 
                    <div style={{height: 'calc(100% - 200px)'}}>
                        <Loading text="Searching for Syncsketch Review..." />
                    </div> : null
                }
            </>)
    }
    return (
        <Dialog id="pm-upload-review" showHeader={false} visible={visibility}
        className="pm-dialog" ref={dialog} onHide={() => showUploadReviewDlg.setFalse()}>
            <DlgHeader />
            <ScrollPanel className="pm" style={{height: '600px', overflowX: 'hidden',
                background: 'white'}}>
                {
                    uploadProgress ? <UploadProgress state={uploadProgress} /> : <UploadForm />
                }
            </ScrollPanel>
        </Dialog>
    );
}