import { SUSPENSE } from "@react-rxjs/core";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext"
import { Stack } from "react-bootstrap"
import { SetNewDepartmentName, SetReviewGroupSelection, SetUploadInputItemName, SetUploadItemName, useNewDetpartmentName, useReviewGroupOptions, useReviewGroupSelection, useUploadInputItemName, useUploadItemName, useUploadReviewGroup } from "../TableItem.Upload.context";

export const TableItemReviewName = ({selectedReview, BoardItemId}) => {
    const uploadName = useUploadInputItemName();

    return (
        <Stack direction="vertical" gap={3} style={{padding: '30px 0px 0px 30px'}}>
            <Stack direction="horizontal" gap={3} style={{marginTop: 20}}>
                <Stack direction="horizontal" gap={3}>
                    <span className="p-float-label">
                        <InputText id="NewReviewName" value={uploadName}  
                            style={{width:'500px'}} onChange={(e) => SetUploadInputItemName(e.target.value)}
                            placeholder="eg. Blocking 2nd Pass, Blocking Revisions 1, etc." />
                        <label htmlFor="Review Name">Review Name</label> 
                    </span>
                </Stack> 
            </Stack>
        </Stack>)
}