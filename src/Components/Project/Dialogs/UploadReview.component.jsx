import { FileUpload } from "primereact/fileupload";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useEffect, useState, useRef } from "react";
import { Divider } from 'primereact/divider';
import { Stack } from "react-bootstrap";
import { InputText } from 'primereact/inputtext'
import "./UploadReview.component.scss"
import { ScrollPanel } from 'primereact/scrollpanel';
import { Button } from 'primereact/button';

export const UploadReview = ({item, reviews, visibility, setVisibility, children}) => {
    const [ReviewGroup, setReviewGroup] = useState(null);
    const [reviewGroups, setReviewGroups] = useState([]);
    const [NewReviewGroup, setNewReviewGroup] = useState('');
    const [ReviewName, setReviewName] = useState('');
    const [ReviewIndex, setReviewIndex] = useState(1);
    const [isDisabled, setIsDisabled] = useState(true);

    const uploader = useRef();
    const dialog = useRef();
    useEffect(() => {
        let reviewGroups = Object.keys(reviews)
            .filter(r => r && r.indexOf('All') < 0)
            .map(r => ({label: r.replace(' Reviews', '')}))
        reviewGroups.push({label: 'New'});

        setReviewGroups(reviewGroups);
    }, [reviews])

    useEffect(() => {
        if (!ReviewGroup || !ReviewGroup.label) {
            setIsDisabled(true);
            return;
        }

        if (ReviewGroup.label === 'New')
            setReviewIndex(1);
        else if (!reviews[ReviewGroup.label + ' Reviews'])
            setReviewIndex(1);
        else setReviewIndex(reviews[ReviewGroup.label + ' Reviews'].length + 1);

        if (ReviewName && ReviewName.length > 1) {
            setIsDisabled(false);
        }
        else if (ReviewGroup.label === 'New' && (!NewReviewGroup || NewReviewGroup.length < 2)) {
            setIsDisabled(true);
        } else {
            setIsDisabled(false);
        }
    }, [ReviewGroup, NewReviewGroup, ReviewName])

    const closeDlg = (evt) => {
        setVisibility(false);
    }
    const UploadItemTemplate = (file, options) => {

        return (
            <Stack direction="horizontal" style={{position:'relative', width: '100%'}} gap={3}>
                <div style={{width: '100px'}}>{options.previewElement}</div>
                <div style={{fontWeight: 600, width: '100%', textAlign: 'left',
                marginLeft: '20px'}}>{file.name}</div>
                <div style={{right: '80px', position: 'absolute'}}>{options.sizeElement}</div>
                <div style={{position: 'absolute', right: '10px'}}>{options.removeElement}</div>
            </Stack>
        )
    }

    const removeFile = (file) => {
        const index = uploader.current.files.indexOf(file);
        uploader.current.remove(index);
    }

    const DlgHeader = (
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

    return (
        <Dialog id="pm-upload-review" showHeader={false} visible={visibility}
        className="pm-dialog" ref={dialog} onHide={() => setVisibility(false)}>
            {DlgHeader}
            <ScrollPanel className="pm" style={{height: '600px', overflowX: 'hidden',
                background: 'white'}}>
                <div style={{padding:'40px', paddingBottom: '0px', fontSize: '16px', marginTop: '10px'}}>
                    <Stack direction="horizontal" gap={3}>
                        <span className="p-float-label">
                            <Dropdown inputId="ReviewGroup" value={ReviewGroup} options={reviewGroups} 
                                onChange={(e) => setReviewGroup(e.value)}
                                optionLabel="label" style={{width:'300px'}}/>
                            <label htmlFor="ReviewGroup">Feedback Department</label>
                        </span>
                        {
                            !!ReviewGroup && ReviewGroup.label === 'New'  ?
                            <InputText id="NewReviewGroup" value={NewReviewGroup}  style={{width:'300px'}}
                            placeholder="eg. Internal, Franchise, Client.."
                            onChange={(e) => setNewReviewGroup(e.target.value)} /> : null
                        }
                    </Stack>
                    <span className="p-float-label" style={{marginTop: '40px'}}>
                        <InputText id="ReviewName" value={ReviewName}  style={{width:'500px'}}
                            placeholder="eg. Blocking, First Pass"
                            onChange={(e) => setReviewName(e.target.value)} />

                        <label htmlFor="ReviewName">Review Name</label>
                    </span>
                </div>
                { ReviewGroup && ReviewGroup.label && ReviewName ?
                    <>
                    <div  style={{marginBottom: '10px', paddingLeft: '40px', marginLeft: '10px', 
                        color: 'gray', marginTop: '20px'}}>
                        Files will be labelled: 
                            <span style={{marginLeft: '10px', fontWeight: '600', color:'black'}}>
                                "{item.Department.text}
                                <span style={{marginLeft: '10px'}}>#{ReviewIndex}</span>
                                <span style={{marginLeft: '10px'}}>|</span>
                                <span style={{marginLeft: '10px'}}>{ReviewName}"</span>
                            </span>
                    </div>
                    <div  style={{marginBottom: '0px', paddingLeft: '40px',
                    marginLeft: '10px', color: 'gray', marginTop: '0px'}}>
                        Files will be uploaded to the
                            <span style={{marginLeft: '10px', fontWeight: '600', color:'black'}}>
                                "{
                                    ReviewGroup && ReviewGroup.label !== 'New' ? ReviewGroup.label : NewReviewGroup
                                }"
                            </span>
                            <span style={{marginLeft: '10px'}}>Review Link for this item.</span>
                    </div>
                    </> : <div style={{paddingLeft: '40px', marginBottom: '0px', 
                        marginLeft: '10px', color: 'red', marginTop: '20px'}}>
                                Uploading requires a<span style={{marginLeft:'10px', fontWeight: 600}}>"Feedback Department"</span>
                                <span style={{marginLeft:'10px'}}>as well as a </span>
                                <span style={{marginLeft:'10px', fontWeight: 600}}>"Review Name"</span>
                            </div>
                }
                <FileUpload itemTemplate={UploadItemTemplate} multiple disabled={isDisabled} 
                    ref={uploader}/>
            </ScrollPanel>
        </Dialog>
    );
}