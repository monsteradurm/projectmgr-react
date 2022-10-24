import { bind, SUSPENSE } from "@react-rxjs/core";
import { Dropdown } from "react-bootstrap";
import DropdownItem from "react-bootstrap/esm/DropdownItem";
import { map, tap } from "rxjs";
import * as _ from 'underscore';
import { SetCurrentRoute } from "../../Application.context";
import { BoxService } from "../../Services/Box.service";
import { FirebaseService } from "../../Services/Firebase.service";
import { NestedDropdown } from "../General/NestedDropDown.component";

export const [useGalleryItems, GalleryItems$] = bind(
    FirebaseService.GalleryItems$.pipe(
    ), SUSPENSE
)

const BuildNestedMenu = ([title, items], key=null) => {
    if (!key)
        key = 'NestedGallery_' + title;

    if (title === 'items')
        return items.map(i => {
            let title = i.name;
            if (title.indexOf('.') > 0) {
                let titleArr = title.split('.');
                titleArr.pop();
                title = titleArr.join('.');
            }
            return <Dropdown.Item key={key + '_' + i.id} onClick={
                () => SetCurrentRoute('/Gallery?id=' + i.id + '&title=' + title)
            }>{title}</Dropdown.Item>
        })

    return <NestedDropdown key={key} title={title}>
        {   _.map(Object.entries(items), n => BuildNestedMenu(n))   }
    </NestedDropdown>
}

const InitialGalleryMenu = <DropdownItem>Loading...</DropdownItem>
export const [useGalleryMenu, GalleryMenu$] = bind(
    GalleryItems$.pipe(
        map(items => _.reduce(items, (acc, cur) => {
            let last = acc;
            const nesting = cur.nesting;
            for(var i = 0; i < nesting.length; i++) {
                if (i === 0)
                    last = acc;

                const n = nesting[i];
                if (!last[n])
                    last[n] = {};

                if (i === nesting.length - 1) {
                    if (!last[n].items)
                        last[n].items = [];
                    last[n].items.push(cur);
                } else {
                    last = last[n];
                }
            }
            return acc;
            }, {})
        ),
        map(nested => _.map(Object.entries(nested), n => BuildNestedMenu(n))),
    ), InitialGalleryMenu
)