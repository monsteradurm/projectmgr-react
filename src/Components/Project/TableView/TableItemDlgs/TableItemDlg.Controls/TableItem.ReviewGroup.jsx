import { SUSPENSE } from "@react-rxjs/core";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext"
import { useEffect, useState } from "react"
import { Button, Stack } from "react-bootstrap"
import { useInput } from "react-hanger";
import { useBoardItemName } from "../../../Context/Project.Item.context";
import { useGroup } from "../../../Context/Project.Objects.context";
import { SetNewDepartmentName, SetReviewGroupSelection, useNewDetpartmentName, useReviewGroupOptions, useReviewGroupSelection, useUploadReviewGroup } from "../TableItem.Upload.context";

export const TableItemReviewGroup = ({Element, Group, ssReviews, selectedReview}) => {
    const SelectedReviewGroup = useReviewGroupSelection();
    const newDepartment = useNewDetpartmentName();
    const DepartmentOptions = useReviewGroupOptions();

    useEffect(() => {
        if(ssReviews?.length === 1) {
            const review = ssReviews[0]
            SetReviewGroupSelection(review.department);
        }
    }, [ssReviews])
    
    if ([SelectedReviewGroup, newDepartment, DepartmentOptions].indexOf(SUSPENSE) >= 0) 
        return <></>

    return (
        <Stack direction="vertical" gap={3} style={{padding: '50px 0px 0px 30px'}}>
            <Stack direction="horizontal" gap={3}>
                <span className="p-float-label">
                    <Dropdown inputId="ReviewGroup" value={SelectedReviewGroup} options={DepartmentOptions} 
                        placeholder="eg. Internal or Client"
                        scrollHeight={800}
                        onChange={(e) => SetReviewGroupSelection(e.value)} style={{width:'300px'}}/>
                    <label htmlFor="ReviewGroup">Feedback Department</label>
                </span>
                {
                    SelectedReviewGroup === 'New' ?
                    <Stack direction="horizontal" gap={3}>
                        <InputText id="NewReviewGroup" value={newDepartment}  
                            style={{width:'300px'}} onChange={(e) => SetNewDepartmentName(e.target.value)}
                            placeholder="eg. Internal, Franchise, Client.." /> 
                    </Stack> : null
                }
            </Stack>
        </Stack>)

}
/*
<Button icon="pi pi-check" 
            style={{ display: textInput.value.length > 3 ? null : 'none'}} />
            
        : 

        <Button icon="pi pi-check"
            style={{background: 'rgb(23, 90, 99)'}} disabled />
            */