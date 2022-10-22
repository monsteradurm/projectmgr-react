import { SUSPENSE } from "@react-rxjs/core";
import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import { Loading } from "../General/Loading";
import { ScrollingPage } from "../General/ScrollingPage.component";
import parse from 'html-react-parser'
import { useApplication, useApplicationResponses, useResponseSearchFilter, useResponseName,
    useResponseEmail, 
    useResponsePhone,
    useResponseExperience,
    useResponseLocation,
    useResponseSubmitted,
    useResponseResume,
    useResponseWebsite,
    useResponseCV,
    SetSelectedResponseId, useSelectedFormId, SetSelectedFormId,
    useSelectedResponse,
    useResponseComments,
    useAverageRating,
    useResponseRatings,
    useResponseSortBy,
    useResponseSortReversed, useApplicationResponseMap,
    SetResponseSearchFilter,
    useResponseCommenter} from "./Applications.context";
import { ApplicationsFilterBar } from "./Applications.Filterbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button, InputTextarea, Rating } from "primereact";
import "./Applications.component.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileDownload, faLink, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { Stack } from "react-bootstrap";
import { Sidebar } from "primereact/sidebar";
import _ from "underscore";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import moment from 'moment';
import StarRatings from 'react-star-ratings';
import { useAllUsersByGraphId } from "../../App.Users.context";
import { SendToastError } from "../../App.Toasts.context";
import { TypeformService } from "../../Services/Typeform.service";
import { take } from "rxjs";
const rowExpansionTemplate = (response) => {
    const email = useResponseEmail(response);
    const phone = useResponsePhone(response);
    const setRating = (r) => {

    }
    return <Stack direction="vertical" style={{padding: '10px 80px'}}>
        <Stack direction="horizontal" gap={3} style={{fontSize: 16}}>
            <div style={{marginRight: 30}}>{email}</div>
            <div  style={{marginRight: 30}}>{phone}</div>
            <div className="mx-auto"></div>
        </Stack>
    </Stack>
}

const EmailTemplate = (response) => {
    const email = useResponseEmail(response);
    return <> { email && <div className="response-link">
    <FontAwesomeIcon icon={faEnvelope}  style={{color: '#555'}}/>
</div> }</>
}

const PhoneTemplate = (response) => {
    const phone = useResponsePhone(response);
    return <> { phone && <div className="response-link" style={{color: 'gray'}}>
    <FontAwesomeIcon icon={faPhone} style={{color: '#555'}}/>
</div> }</>
}

const CommentsTemplate = (response) => {
    const comments = useResponseComments(response);
    return <div style={{fontWeight: 600}}>{comments.length}</div>
}

const RatingsCountTemplate = (response) => {
    const ratings = useResponseRatings(response);
    return <div style={{fontWeight: 600}}>{ratings.length}</div>
}
const WebsiteTemplate = (response) => {
    const l = useResponseWebsite(response);
    return <> { l && <div className="response-link">
        <FontAwesomeIcon icon={faLink} onClick={() => window.open(l, "_blank")}/>
    </div> }</>
}
const CVTemplate = (response) => {
    const doc = useResponseCV(response);
    return <> { doc && <div className="response-link">
    <FontAwesomeIcon icon={faFileDownload} onClick={() => onDownload(doc)} />
</div> }</>
}
const ResumeTemplate = (response) => {
    const doc = useResponseResume(response);
    return <> { doc && <div className="response-link">
    <FontAwesomeIcon icon={faFileDownload} onClick={() => onDownload(doc)} />
</div> }</>
}
const RatingTemplate = (response) => {
    const rating = useAverageRating(response);
    const ratings = useResponseRatings(response);

    if (ratings?.length > 0)
        return <Rating value={rating} stars={10} cancel={false}/>
    return <Rating value={rating} stars={10} cancel={false} className="no-rating"/>

}
const ExperienceTemplate = (response) => {
    const xp = useResponseExperience(response);
    return <div style={{fontWeight: 600}}>{xp}</div>
}

const LocationTemplate = (response) => {
    let loc = useResponseLocation(response);
    if (loc?.length > 50)
        loc = loc.slice(0, 47) + '...'
    return <div style={{fontWeight: 400}}>{loc}</div>
}

const SubmittedTemplate = (response) => {
    const d = useResponseSubmitted(response);
    return <div style={{fontWeight: 400}}>{d}</div>
}

const onDownload = (addr) => {
    TypeformService.Download$(addr).pipe(
        take(1)
    ).subscribe((res) => {
        if (!res)
            SendToastError("Could not download file")
        else 
            window.open(res, "_blank")
    })
}
export const ApplicationsComponent = ({headerHeight}) => {
    const AllUsers = useAllUsersByGraphId();
    const ResponseMap = useApplicationResponseMap();
    const [expandedRows, setExpandedRows] = useState([]); 
    const [searchParams, setSearchParams] = useSearchParams();
    const FormId = useSelectedFormId();
    const Form = useApplication(FormId);
    const Responses = useApplicationResponses(FormId);
    const [FilteredResponses, SetFilteredResponses] = useState(SUSPENSE);
    const Search = useResponseSearchFilter();
    const [SelectedResponse, SetSelectedResponse] = useState(null);
    const [ResponseId, SetResponseId] = useState(null);
    const SortBy = useResponseSortBy();
    const SortByReversed = useResponseSortReversed();
    const [editorState, setEditorState] = useState(
        ''
    );
    SetNavigationHandler(useNavigate());

    useEffect(() => {
        const form = searchParams.get('Form');
        if (FormId !== form)
            SetSelectedFormId(form);

        const response = searchParams.get('Response');
        if (ResponseId !== response)
            SetResponseId(response);

    }, [searchParams]);

    useEffect(() => {
        setEditorState('');
        if (!ResponseId && !!SelectedResponse)
            SetSelectedResponse(null);

        if (!Responses || Responses === SUSPENSE || ResponseMap === SUSPENSE )
            return;

        else {
            const response = ResponseMap[ResponseId]
            SetSelectedResponse(response ? response : null);
        }

    }, [ResponseId, Responses, ResponseMap]);

    useEffect(() => {
        if (Responses === SUSPENSE || !Responses) {
            if (FilteredResponses !== SUSPENSE)
                SetFilteredResponses(SUSPENSE);
            return
        }

        let result = [...Responses];

        if (Search?.length > 0) {
            const s = Search.toLowerCase();
            result = result.filter(r => JSON.stringify(r).toLowerCase().indexOf(s) >= 0)
        }

        result = _.sortBy(result, r => {
            switch(SortBy) {
                case 'Name': return useResponseName(r).toLowerCase();
                case 'Rating': return useAverageRating(r);
                case 'Submitted': return useResponseSubmitted(r);
                case 'Experience': return useResponseExperience(r);
                case 'Comments': return useResponseComments(r)?.length;
            }
        }).reverse();
        
        if (SortByReversed) result = result.reverse();
        if (SortBy === 'Name') result = result.reverse();

        SetFilteredResponses(result);

    }, [Responses, SortBy, Search, SortByReversed])

    useLayoutEffect(() => {
        let titles = ['Applications'];
        
        if (Form !== SUSPENSE && Form?.nesting)
            titles = titles.concat(Form.nesting)

        SetTitles(titles);
    }, [Form])

    const NameTemplate = (response) => {
        const name = useResponseName(response);
    
        return <div style={{fontWeight: 600, textDecoration: 'underline' , cursor: 'pointer'}}
            onClick={(e) => SetSelectedResponseId(response.response_id, searchParams, setSearchParams)}>{name}</div>
    }

    if (Form === SUSPENSE || Responses === SUSPENSE || FilteredResponses === SUSPENSE)
        return <Loading text="Retrieving Typeform Application..." />
        
    return (
    <>
        <ApplicationsFilterBar />
        <ScrollingPage key="page_scroll" offsetY={headerHeight} >
            <Sidebar visible={!!SelectedResponse} position="right" style={{width:'50%'}} className="pm-response-sidebar"
            showCloseIcon={false}
            onHide={() => SetSelectedResponseId(null, searchParams, setSearchParams)}>
                {
                    SelectedResponse && <>
                        <div style={{fontSize: 20, fontWeight: 600, position: 'absolute', top: 20, left: 20,
                        borderBottom: 'solid 2px rgb(150, 76, 201)', width: 'calc(100% - 40px)', paddingBottom: 10}}>
                            {useResponseName(SelectedResponse)}</div>
                    </>
                }
                <Stack direction="vertical" style={{marginTop: 30}}>
                    {
                        useResponseComments(SelectedResponse).map((c, i) => <Stack direction="horizontal"
                        key={"Comment_" + SelectedResponse?.response_id + "_" + i} style={{width: '100%'}}>
                            <div className="mx-auto"></div>
                            <Stack direction="vertical"  className="speech-bubble" style={{flex: 'unset', fontSize: 15}}>
                                <Stack direction="horizontal" className="comment-header">
                                    <div style={{marginRight: 40}}>{useResponseCommenter(c.user, AllUsers)}</div>
                                    <div className="mx-auto"></div>
                                    <div style={{fontWeight: 300}}>{moment(c.submitted).format('MMM DD, YYYY HH:mm')}</div>
                                </Stack>
                                <div style={{marginTop: 5, fontWeight: 400}} className="comment-note">
                                    {parse(c.note)}
                                </div>
                            </Stack>
                        </Stack>)
                    }
                </Stack>
                <div style={{position: 'absolute', bottom: 0, width: 'calc(100% - 40px)', paddingTop: 20,
                    borderTop: 'solid 2px rgb(150, 76, 201)', height: 250, right: 20}}>
                    <ReactQuill theme="snow" value={editorState} onChange={setEditorState} 
                    style={{height: 100, width: '100%', marginBottom: 60, right: 10}}/>
                    <Stack direction="horizontal">
                        <div className="mx-auto"></div>
                        <Button style={{width: 150}}>Add Comment</Button>
                    </Stack>
                </div>
            </Sidebar>
            <Stack direction="horizontal" gap={3}>
                <div className="pm-tag-filter" style={{color: '#888', fontWeight: 400, fontSize: 20}}>
                    {FilteredResponses?.length} Responses...
                </div>
                {
                    Search && Search.length > 0 &&
                    <div className="pm-tag-filter" style={{color: '#888', fontWeight: 400, fontSize: 20}}
                        onClick={() => SetResponseSearchFilter(null, searchParams, setSearchParams)}>
                    (searched: {Search})
                </div>
                }
            </Stack>
            <DataTable value={FilteredResponses} className="response-table" rowExpansionTemplate={rowExpansionTemplate}
                onRowToggle={(e) => setExpandedRows(e.data)} dataKey="response_id" expandedRows={expandedRows} >
                <Column header="Name" body={NameTemplate} className="response-name"></Column>
                <Column header="Location" body={LocationTemplate} className="response-location"></Column>
                <Column header="XP (Years)" body={ExperienceTemplate} className="response-experience"></Column>
                <Column header="Submitted" body={SubmittedTemplate} className="response-submitted"></Column>
                <Column header="Email" body={EmailTemplate} className="response-email"></Column>
                <Column header="Website" body={WebsiteTemplate} className="response-website"></Column>
                <Column header="CV" body={CVTemplate} className="response-cv"></Column>
                <Column header="Resume" body={ResumeTemplate} className="response-resume"></Column>
                <Column header="Phone" body={PhoneTemplate} className="response-phone"></Column>
                <Column header="Comments" body={CommentsTemplate} className="response-comment_count"></Column>
                <Column header="Ratings" body={RatingsCountTemplate} className="response-comment_count"></Column>
                <Column header="Rating (Average)" body={RatingTemplate} className="response-rating"></Column>
            </DataTable>
        </ScrollingPage>
    </>)
}