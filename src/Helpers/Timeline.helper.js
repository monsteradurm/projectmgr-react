import moment from 'moment';

export const formatTimeline = (tl) => {
    if (!tl.text || tl.text.length < 1 || tl.text.indexOf(' - ') < 0)
        return 'No Timeline';
    const range = tl.text.split(' - ');

    return range.map(d => moment(d).format('MMM DD')).join(' - ');
}