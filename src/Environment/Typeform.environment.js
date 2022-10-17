export const TypeformConfig = {
    secret: "3JEoJ29wMQ5s4NUgnZeD5tLBUMW1jsr6AxMvXJxYzVNJ",
    client: "AwiCGFptjijQ8BzpX6dde11PgCerEeCpLmr2iz8y4BQV",
    token: 'tfp_HxywFU88UegZnJW3j1NqJCaCavDLLx5W8Q3Mmt3gzSyD_3pcoTwxNAW7DBY',
    workspace: "fzi2MS"
}

export const TypeformEndPoints = {
    Forms: '/typeform/forms?workspace_id=' + TypeformConfig.workspace,

    RetrieveFile: (form_id, response_id, answer) => {
        let fileArr = answer.file_url.split('/');
        let file = fileArr[fileArr.length - 1];
        return 'typeform/forms/' + form_id + '/responses/' +
            response_id + '/fields/' + answer.field.id + '/files/' + file;
    },

    RemoveResponse: (form_id, response_id) => '/typeform/forms/' + form_id + '/responses?included_response_ids=' + response_id,

    Responses: (form_id) => '/typeform/forms/' + form_id + '/responses?page_size=1000',

    Webhooks: (id) => '/typeform/forms/' + id + '/webhooks',
}