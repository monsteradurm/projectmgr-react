import { SUSPENSE } from '@react-rxjs/core';
import moment from 'moment';

export const formatTimeline = (tl) => {
    if (tl === SUSPENSE)
        return null;
    
    if (!tl.text || tl.text.length < 1 || tl.text.indexOf(' - ') < 0)
        return 'No Timeline';
    const range = tl.text.split(' - ');

    return range.map(d => moment(d).format('MMM DD')).join(' - ');
}

export const formatDate = (d) => {
    if (d === SUSPENSE)
        return null;
    
    if (!d.text || d.text.length < 1 || d.text.indexOf(' - ') < 0)
        return null;

    return moment(d).format('MMM DD, HH:mm');
}

export const calculateBusinessDays = (start_date, end_date) => {
    const d1 = start_date.clone();
    let num_days = 0;
    while(end_date.diff(d1.add(1, 'days')) > 0) {
            if ([0, 6].includes(d1.day())) {
                    // Don't count the days
            } else {
                    num_days++;
            }
    }
    return num_days;
}