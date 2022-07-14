import { faFaceFrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Stack } from "react-bootstrap"

export const ErrorLoading = ({icon, iconSize, fontSize, text, opacity, gap, weight, color}) => {
    const dColor = color ? color : 'gray';
    const dWeight = weight ? weight : 600;
    const dGap = gap ? gap : 3;
    const dOpacity = opacity ? opacity : 0.5;
    const dFontSize = fontSize ? fontSize : 20;
    const dIconSize = iconSize ? iconSize : '6x';
    const dIcon = icon ? icon : faFaceFrown;
    return (
        <Stack direction="vertical" gap={dGap} className="mx-auto my-auto" 
            style={{justifyContent: 'center', opacity:{dOpacity}, height: '100%'}}>
            <FontAwesomeIcon icon={dIcon} size={dIconSize} style={{color: dColor, opacity: dOpacity}}/>
            {
                text ? 
                <div style={{fontWeight: {dWeight}, color: {dColor}, fontSize:{dFontSize}, opacity:{dOpacity}}}>
                    {text}
                </div> : null
            }
        </Stack>
    )
}