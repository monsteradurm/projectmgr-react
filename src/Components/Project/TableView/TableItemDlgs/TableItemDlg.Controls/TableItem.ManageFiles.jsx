import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown"
import { useCallback, useEffect, useRef, useState } from "react";
import { Stack, Row, Col } from "react-bootstrap";
import { ClearFilesFromUpload, HandleFilesAdded, ModifyFileFromUpload, RemoveFileFromUpload, 
    useUploadEvent, StartUploading, useFilesForUpload } from "../TableItem.Upload.context";
import moment from 'moment';
import { faFile, faFilm, faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-regular-svg-icons";

async function getThumbnailForVideo(videoUrl) {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");

    video.style.display = "none";
    canvas.style.display = "none";
  
    // Trigger video load
    await new Promise((resolve, reject) => {
      video.addEventListener("loadedmetadata", () => {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Seek the video to 25%
        video.currentTime = video.duration * 0.25;
      });
      video.addEventListener("seeked", () => resolve());
      video.src = videoUrl;
    });
  
    // Draw the thumbnail
    canvas
      .getContext("2d")
      .drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const imageUrl = canvas.toDataURL("image/png");
    return imageUrl;
  }

const FileItemTemplate = ({item}) => {
    const [icon, setIcon] = useState(faFile);
    const {file, type, thumbnail} = item;
    const {size, lastModified, name } = file;
    const mimeType = file.type;
    const [options, setOptions] = useState([]);
    const [video, setVideo] = useState(null);
    const uploadEvent = useUploadEvent();

    useEffect(() => {
        if (mimeType.indexOf('image') >= 0)
            setOptions(['Standard', '360 image']);
        else if (mimeType.indexOf('video') >= 0) {
            setOptions(['Standard', '360 video']);
            setIcon(faFilm);
        }
        else setOptions([]);
        if (mimeType.indexOf('pdf') >= 0) {
            setIcon(faFilePdf)
        }
    }, [mimeType, file])

    return (
            <Row className="pm-itemUpload-row">
                <Col className="pm-itemUpload-thumbnail">
                <FontAwesomeIcon icon={icon} className="pm-itemUpload-thumbnail" />
                    {
                        mimeType.indexOf('image') >= 0 ? 
                        <img src={thumbnail} className="pm-itemUpload-thumbnail" /> : null
                    }
                    {
                        mimeType.indexOf('video') >= 0 && mimeType.indexOf('quicktime') < 0?
                        <video src={thumbnail} className="pm-itemUpload-thumbnail" type={type}></video>
                        : null
                    }
                    {
                        mimeType.indexOf('mp4') < 0 && mimeType.indexOf('image') < 0 ?
                        <div className="pm-itemUpload-thumbnail" style={{opacity:0.8}}></div> : null
                    }
                </Col>
                <Col xs={4} className="pm-itemUpload-col name" style={{textAlign: 'left'}}>{name}</Col>    
                {       
                    options?.length ? 
                    <Col className="pm-itemUpload-col">
                        <Dropdown value={type} options={options} onChange={(e) => ModifyFileFromUpload(file, e.value)}/>
                    </Col> :
                    <Col className="pm-itemUpload-col">{type}</Col>
                }
                <Col className="pm-itemUpload-col type">{mimeType}</Col>
                <Col className="pm-itemUpload-col">{Math.round(size / 1024 / 1024 * 100) / 100} MB</Col>
                <Col className="pm-itemUpload-col date" style={{textAlign: 'right'}}>
                    {moment(lastModified).format('YY/MM/DD HH:mm')}</Col>
                <Col style={{maxWidth: 40}}><Button icon="pi pi-times" onClick={(e) => RemoveFileFromUpload(file)}/></Col>
            </Row>          
    )
}

const handleClear = (evt) => {
    console.log("Clearing uploads...")
    ClearFilesFromUpload();
}

export const TableItemManageFiles = ({reviewId, pulse}) => {
    const inputRef = useRef(null);
    const files = useFilesForUpload();

    const handleChoose = useCallback(() => inputRef.current.click(), [inputRef]);
    const handleUpload = useCallback(() => StartUploading(reviewId), [reviewId])
    useEffect(() => {
        console.log("FILES TO UPLOAD UPDATED: ", files)
    }, [files]);

    return (
        <div>
            <Stack direction="horizontal" gap={2} style={{marginTop:20, right: 20}}>
                <div className="mx-auto"></div>
                <Button label="Choose" onClick={handleChoose}/>
                <Button label="Upload" onClick={handleUpload}/>
                <Button label="Cancel" onClick={handleClear}/>
            </Stack>
            <div style={{marginTop: 40}}>
            {
                files.map(f => <FileItemTemplate item={f} key={f.file.name} />)
            }
            </div>
          <input style={{display: 'none'}} ref={inputRef} type="file" multiple="multiple" onChange={
              (evt) => HandleFilesAdded(evt, pulse)}
          />
        </div>
      );

    /*
    return (<FileUpload name="demo[]" url="./upload" multiple 
    onSelect={onFilesSelected} onBeforeDrop={onFilesSelected}
    style={{marginTop: 0}} customUpload={true}/>)*/
}