import { Stack } from "react-bootstrap";
import { ProgressBar } from "primereact/progressbar";
import { Loading } from "../../../General/Loading";

export const UploadProgress = ({state}) => {
    if (!state) return;

    return (
        <Stack direction="vertical" gap={3} className="mx-auto my-auto" 
            style={{justifyContent: 'center', height: '100%', fontSize: 20,
            textAlign: 'center', position: 'relative'}}>

            <div style={{position:'absolute', width: '100%', top:100, opacity:0.5}}>
                <Loading spinner= "breeding-rhombus-spinner" size={90}/>
            </div>

            <Stack direction="horizontal" gap={3} 
            style={{textAlign: 'center', fontWeight:600, marginTop: 140, fontWeight: 400,
            color: 'gray'}} className="mx-auto">
                {
                    state?.index ? 
                    <div>{state.index}</div> : null
                }
                <div>{state.item}</div>
            </Stack>
            {
                state?.progress ?
                <div className="mx-auto" style={{padding: '0px 100px', height:50, width: '100%'}}>
                    <ProgressBar value={state.progress} color="rgb(23, 90, 99)" 
                    style={{height: 40, lineHeight:40, fontWeight: 600}} />
                </div> : null
            }
            {
                state?.description ?
                <div>{state.description}</div> : null
            }
        </Stack>
    )
}