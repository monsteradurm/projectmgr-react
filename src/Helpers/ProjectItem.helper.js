export const ItemBadgeIcon = (b) => {
    return (<i className={b.FaIcon} 
        style={{'fontSize': '1.5em', marginRight: '0.5em'}}></i>)
}

export const FilterItemArtists = (artistCol, allUsers) => {
    if (!allUsers || !artistCol?.value) return [];

    return artistCol.value.filter(a => a && a.length > 0).reduce(
        (acc, a) => {
            if (allUsers[a.toLowerCase()])
                acc.push(allUsers[a.toLowerCase()])
            return acc;
        }, []
    );
}

export const ParseBoardItemName = (name) => {
    if (name.indexOf('/') < 0)
        // no task provided
        return [name, null]

    const nameArr = name.split('/');
    const element = nameArr.shift();

    // account for multiple / written into names
    const task = nameArr.join('/');

    return [element, task];
}

export const ReviewItemName = (dep, index, name, filename, fileCount=1, fileIndex=null) => {
    console.log("DEP", dep, "INDEX", index, "name", name, "filename", filename, fileCount, fileIndex)
    let indexLabel = String(index).padStart(3, '0')

    if (fileCount > 1 && fileIndex)
        indexLabel += `.${fileIndex}`

    let result =  `${dep} ${indexLabel} ${name}`;
    if (filename) {
        const extArr = filename.split('.');
        const ext = extArr[extArr.length - 1];
        result += `.${ext}`;
    }
    return result;
}
