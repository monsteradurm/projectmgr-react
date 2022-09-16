import { SUSPENSE } from "@react-rxjs/core";
import { Button } from "primereact/button";
import { useContext, useId } from "react";
import { useSearchParams } from "react-router-dom";
import { BoardItemContext, useBoardItemBadges } from "../../Context/Project.Item.context";
import { toggleArrFilter } from "../../Overview.filters";

const SuspendedBadges = () => {
    const key = useId();

    return [0, 1].map(b =>
    <Button className="pm-badge suspended p-button-rounded" key={`${key}_${b}`} 
        style={{background: 'lightgray'}}>
    </Button>)
}

const ItemBadgeIcon = (b) => {
    return (<i className={b.FaIcon} 
        style={{'fontSize': '1.5em', marginRight: '0.5em', color: 'white'}}></i>)
}

export const TableItemBadges = () => {

    const { BoardItemId } = useContext(BoardItemContext);
    const Badges = useBoardItemBadges(BoardItemId);
    const [searchParams, setSearchParams] = useSearchParams();

    if (Badges === SUSPENSE)
        return <SuspendedBadges />
    
    return Badges.map((b) => 
        <Button className="pm-badge p-button-rounded" key={`${BoardItemId}_${b.Title}`}
            onClick={(evt) => 
                toggleArrFilter(b.Title, 'BoardBadgeFilter', searchParams, setSearchParams)}
            tooltip={b.Title}
            tooltipOptions={{position: 'top', className:"pm-tooltip"}}
            style={{background: b.Background}}>
                {ItemBadgeIcon(b)}
        </Button>)
}