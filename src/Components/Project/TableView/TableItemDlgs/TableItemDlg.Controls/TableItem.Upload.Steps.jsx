import { Steps } from 'primereact/steps';
import * as _ from 'underscore';
import { SetCurrentUploadStep, UploadSteps, useCurrentUploadStepIndex } from '../TableItem.Upload.context';



export const TableItemUploadSteps = ({}) => {
    const activeIndex = useCurrentUploadStepIndex();
    
    const onSelect = (e) => {

    }

    return (
        <Steps activeIndex={activeIndex} model={UploadSteps} 
            onSelect={(e) => SetCurrentUploadStep(e.index)} readOnly={false}/>
    )
}
