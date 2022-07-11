export const defaultStatus = {  text: 'Not Started', info: { color: 'black'}    }

export const ProjectItemState = {
    item: {
        Element: null,
        Task: null,
        Artist: null,
        Director: null,
        Timeline: 'No Dates',
        Badges: [],
        Status: defaultStatus,
        Tags: {
            Review: [],
            Item: []
        },
        LastUpdate: null,
        Reviews: { 'All Reviews' : [] },
        Reference: { 'All Reference' : [] },
        CurrentReview: null,
    },
    
    params: {
        ActiveTab: 'Summary'
    }
}

export const DispatchProjectItemState = (state, action) => {
    switch(action.type) {
        case 'ActiveTab' :
            return { ...state, 
                params : { ...state.params, ActiveTab : action.value }
            }
        case 'Badges' : 
            return { ...state,
                item: { ...state.item, Badges: action.value }
            }
        case 'Artist' : 
            return { ...state,
                item: { ...state.item, Artist: action.value }
            }

        case 'Director' : 
            return { ...state,
                item: { ...state.item, Director: action.value }
            }

        case 'Timeline' : 
            return { ...state,
                item: { ...state.item, Timeline: action.value }
            }

        case 'Status' : {
            let s = action.value;
            if (!s || !s.text || s.text.length < 1)
                s = defaultStatus;

            return { ...state,
                item: { ...state.item, Status: s }
            }
        }

        case 'Tags' : 
            return { ...state,
                item: { ...state.item, Tags: action.value }
            }

        case 'ReviewTags' : 
            return { ...state,
                item: { ...state.item, Tags: { 
                    ...state.item.Tags, 'Review' : action.value }
                }
            }
        case 'ItemTags' : 
            return { ...state,
                item: { ...state.item, Tags: { 
                    ...state.item.Tags, 'Item' : action.value }
                }
            }

        case 'LastUpdate' :
            return { ...state,
                item: { ...state.item, LastUpdate: action.value }
            }

        case 'Reviews' :
            return { ...state,
                item: { ...state.item, Reviews: action.value }
            }

        case 'Reference' :
            return { ...state,
                item: { ...state.item, Reviews: action.value }
            }

        case 'CurrentReview' :
            return { ...state,
                item: { ...state.item, CurrentReview: action.value }
            }
        case 'ReviewGroups' :
            return { ...state,
                item: { ...state.item, ReviewGroups: action.value }
            }

        case 'Name' : {
            let nameArr = [action.value, null]
            if (action.value.indexOf('/'))
                nameArr = action.value.split('/')

            return { ...state,
                    item: { ...state.item,
                        Element: nameArr[0],
                        Task: nameArr[1]
                        }
                    }
         }   
    }
}