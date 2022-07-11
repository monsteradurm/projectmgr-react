export const SyncsketchConfig = {
    token: 'b1bb92aa73acc60d25721172ba0f64db2654e5ca',
    user: 'acranchliquidanimationcom',
    url: 'https://syncsketch.com/api/v2/',
    account: '116681',
}

export const SyncsketchQueries = {
    AllUsers: `/syncsketch-v2/account/${SyncsketchConfig.account}/`,
    AllProjects: `/syncsketch/project/?active=1&is_archived=0&account__active=1`,

    ReviewsByName: (name) => `/syncsketch/review/?name__istartswith=${name}&active=1`,
    ItemById: (id) => `/syncsketch/item/${id}/`,
    AllFeedback: (itemId) => `/syncsketch/frame/?item__id=${itemId}`
}
