import { Button } from "primereact/button"

export const DialogHeader = ({HeaderLeft, color, Header, HeaderRight, onClose}) => {
    return (
        <div className="pm-dialogHeader" style={{position: 'relative', background: color? color : 'black'}}>
            <span>
                {
                    HeaderLeft ? <span>{HeaderLeft}</span> : null
                }
                <span style={{marginLeft:'10px'}}>
                    { Header }
                    {
                        HeaderRight ? 
                            <span style={{float:'right', marginRight: 30}}>({HeaderRight})</span>
                            : null
                    }
                </span>
            </span>
            <Button icon="pi pi-times" style={{background: 'transparent', border:'none'}}
            className="p-button-rounded" aria-label="Cancel" 
            onClick={onClose}/>
        </div>
    )
}