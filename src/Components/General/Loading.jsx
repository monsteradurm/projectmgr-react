import { Stack } from "react-bootstrap"
import { SemipolarSpinner } from "react-epic-spinners"

export const Loading = ({size, fontSize, text, opacity, gap, weight, color}) => {
    const dSize = size ? size : 100;
    const dColor = color ? color : 'gray';
    const dWeight = weight ? weight : 600;
    const dGap = gap ? gap : 3;
    const dOpacity = opacity ? opacity : 0.5;
    const dFontSize = fontSize ? fontSize : 20;
    
    return (
        <Stack direction="vertical" gap={dGap} className="mx-auto my-auto" 
            style={{justifyContent: 'center', opacity:{dOpacity}, height: '100%'}}>
            <SemipolarSpinner color={dColor} className="mx-auto" size={dSize}
            style={{opacity:dOpacity}}/>
            {
                text ? 
                <div style={{fontWeight: {dWeight}, color: {dColor}, fontSize:{dFontSize}}}>
                    {text}
                </div> : null
            }
        </Stack>
    )
}