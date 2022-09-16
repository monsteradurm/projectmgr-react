import { Stack } from "react-bootstrap"

export const SummaryText = ({textArr}) => {
    return (<Stack direction="horizontal" gap={2}  className="mx-auto" 
        style={{fontSize: 20, width: 'fit-content'}}>
        {
            textArr.map(t => {
                return (<div key={t.id} style={{fontWeight: t.bold ? 600 : 400, 
                    fontSize: t.bold || t.primary ? 24 : null,
                    borderBottom: t.primary ? `solid 2px ${t.primary}` : null,
                    cursor: t.onClick ? 'pointer' : null,
                    paddingTop: t.bold || t.primary ? null : '5px',
                    color: t.primary? t.primary : null}}
                    onClick={t.onClick ? t.onClick : null}>{t.text}</div>
            )})
        }
    </Stack>)
}