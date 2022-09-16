import { useContext, useId } from "react";
import { Stack } from "react-bootstrap";
import { NavigationService } from "../../../../../Services/Navigation.service";
import { BoardItemContext } from "../../../Context/Project.Item.context";
import { CreateSyncsketchReview } from "../../../Context/Project.Syncsketch.context";
import { CenteredSummaryContainer } from "../../TableItemControls/TableItem.SummaryContainer";
import { SetCurrentUploadStep, useCurrentUploadStepIndex, useNewDetpartmentName, useReviewGroupSelection, useSyncsketchReviewName, useUploadInputItemName, useUploadItemName, useUploadSyncsketchReview } from "../TableItem.Upload.context"
import { SummaryText } from "../../TableItemControls/TableItem.SummaryText";

const SSReviewValid = ({primary, name, style}) => {
    const id = useId();
    const RowA = [
        {text: 'A Syncsketch Review for', id: id + '0'},
        {text: name, bold: true, id: id + '1'},
        {text: 'Already Exists', id: id + '2'}
    ]
    const RowB = [
        {text: 'If this is the intended destination,', id: id + '3'},
        {text: 'proceed', primary, id: id + '4', onClick: () => SetCurrentUploadStep('Define Review Name')},
        {text: 'to the next step.', id: id + '5'}
    ]

    return (
        <CenteredSummaryContainer style={style}>
            <SummaryText textArr={RowA} />
            <SummaryText textArr={RowB} />
        </CenteredSummaryContainer>)
}
const SSReviewNameInvalid = ({primary, name, style}) => {
    const id = useId();
    const RowA = [
        {text: 'The Syncsketch Reivew Name', id: id + '0'},
        {text: name, bold: true, id: id + '1'},
        {text: 'Is not Valid!', id: id + '2'}
    ]

    return (
        <CenteredSummaryContainer style={style}>
            <SummaryText textArr={RowA} />
        </CenteredSummaryContainer>)
}

const SSReviewInvalid = ({primary, name, style, department, boardItemId}) => {
    const id = useId();
    const RowA = [
        {text: 'A Syncsketch Review for', id: id + '0'},
        {text: name, bold: true, id: id + '1'},
        {text: 'Does not Exist!', id: id + '2'}
    ]
    const RowB = [
        {text: 'If this is the intended destination,', id: id + '3'},
        {text: 'Create', primary, id: id + '4', onClick: () =>
            CreateSyncsketchReview(name, department, boardItemId)
        },
        {text: 'a review for this content.', id: id + '5'}
    ]

    return (
        <CenteredSummaryContainer style={style}>
            <SummaryText textArr={RowA} />
            <SummaryText textArr={RowB} />
        </CenteredSummaryContainer>)
}

const SSReviewItemNameValid = ({primary, style, reviewName, url, uploadName}) => {

    const id = useId();
    const itemNameDescription = [
        {text: 'Content will be named ', id: id + '2'},
        {text: uploadName, bold: true, id: id + '3'},
        {text: 'during the upload process. ', id: id + '1'},
    ]

    const proceed = [
        {text: 'If this looks correct,', id: id + '4'},
        {text: 'proceed', primary, id: id + '5', onClick: () => SetCurrentUploadStep('Select Content')},
        {text: 'to the next step.', id: id + '6'}
    ]

    return (
    <CenteredSummaryContainer style={style}>
        <SummaryText textArr={itemNameDescription} key={"ReviewSummary_0"} /> 
        <SummaryText textArr={proceed} key={"ReviewSummary_2"} /> 
    </CenteredSummaryContainer>)
}
const SSReviewItemNameNull = ({style}) => {
    const id = useId();
    const RowA = [
        {text: 'Please write an informative', id: id + '0'},
        {text: 'Review Name', bold: true, id: id + '1'},
        {text: 'for the upload.', id: id + '2'},
    ]

    return (
        <CenteredSummaryContainer style={style}>
            <SummaryText textArr={RowA} />
        </CenteredSummaryContainer>)
}
const SSReviewItemNameInvalid = ({primary, style}) => {
    const id = useId()
    const RowA = [
        {text: 'The Review Name must be at least 6 characters long!', id: id + '0', primary},
    ]

    return (
        <CenteredSummaryContainer style={style}>
            <SummaryText textArr={RowA} />
        </CenteredSummaryContainer>)
}

export const TableItemUploadReviewSummary = ({style, index, primary, boardItemId}) => {
    const ReviewGroup = useReviewGroupSelection();
    const SelectedReview = useUploadSyncsketchReview();
    const ReviewName = useSyncsketchReviewName();
    const NewDepartmentName = useNewDetpartmentName();

    const uploadName = useUploadItemName();
    const uploadInputName = useUploadInputItemName();

    const id = useId();
    
    if (index === 0) {
        if (ReviewGroup === 'New' && NewDepartmentName.length < 5)
            return <SSReviewNameInvalid style={style} primary={'red'} name={ReviewName} />;

        if (!SelectedReview)
            return <SSReviewInvalid style={style} primary={'red'} name={ReviewName} 
            department={ReviewGroup === 'New' ? NewDepartmentName : ReviewGroup}
            boardItemId={boardItemId} />;
        
        return <SSReviewValid style={style} primary={primary} name={ReviewName} />;
    }

    //const itemSummary = [<SummaryText textArr={} key="ReviewSummary_2" />]
    if (index === 1) {
        if (!uploadInputName || uploadInputName.length < 1)
            return <SSReviewItemNameNull style={style} />

        else if (!(uploadInputName?.length > 4)) 
            return <SSReviewItemNameNull style={style} />
            //<SSReviewItemNameInvalid style={style} primary={'red'} />
        
        return <SSReviewItemNameValid primary={primary} style={style} reviewName={ReviewName} 
            url={SelectedReview?.reviewURL} uploadName={uploadName} />
    }
    

    
    return <></>
}