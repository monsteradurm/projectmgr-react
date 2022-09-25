export const MondayConfig = {
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjEwNDEzNzg0NSwidWlkIjoxNjMzMzQ1LCJpYWQiOiIyMDIxLTAzLTI0VDA2OjA1OjAzLjU2MFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo2OTc5NzksInJnbiI6InVzZTEifQ.F33TvuwKuKzIyipXblbTRrlJ2aAtVA3C9ZPVCZKsIAc',
    client_id:  'ddc4de8eafde865ef1b2418acafa0acb',
    client_sec: '78278e7064170bfb9d305cef21aeb0f6',
    client_ss: '78278e7064170bfb9d305cef21aeb0f6',
    tokenURL: 'https://auth.monday.com/oauth2/authorize?client_id=ddc4de8eafde865ef1b2418acafa0acb'
}

export const MondayGraphQL = {

    Query_BoardId: (itemId) => `query {
      items (ids:${itemId}){
        board { id }
      }
    }`,

    Query_AllUsers: () => 
    `query {
      users {
        id
        name
        email
      }
    }`,

    Query_ColumnSettings: (id) => 
    `query {
        boards (ids:${id}) {
         columns {
          settings_str id title
         }
        }
      }`,

      Query_AllTags: () => `query {
        tags {
            id name
        }
      }`,

    Query_TagId: (label) => `mutation {
        create_or_get_tag (tag_name: "${label}") {
          id
        }
      }`,

    Query_ItemUpdates: (id) => `query {
        items (ids: [${id}]) {
            id
            updates (limit: 50) {
                text_body id updated_at body
            }
        }
      }`,

    Mutate_Update: (id, content) => 
        `mutation {
          create_update (item_id: ${id}, body: "${content}") {
              id
          }
        }`,
    Mutate_SimpleColumn: (boardId, itemId, columnId, statusIndex)  => 
        `mutation { change_simple_column_value (board_id: ${boardId}, item_id: ${itemId}, 
            column_id: "${columnId}", value: "${statusIndex}") { id } }`,

    Mutate_TagsColumn: (boardId, itemId, columnId, val)  => 
        `mutation { change_column_value (board_id: ${boardId}, item_id: ${itemId}, 
            column_id: "${columnId}", value: "${JSON.stringify(val).replace(/"/g, '\\"')}") { id } }`,

    Mutate_Columns: (boardId, itemId, val) => `
        mutation { change_multiple_column_values (board_id: ${boardId}, item_id: ${itemId},
            column_values: "${JSON.stringify(val).replace(/"/g, '\\"')}", create_labels_if_missing: true) 
          { id }
        }`,
    
    ArchiveItem: (itemId) => `mutation {
      archive_item (item_id: ${itemId}) {
          id
      }
    }`,

    Mutate_DateColumn: (boardId, itemId, columnId, date) => {
      const value = date ? {date} : { }
       return `mutation {
        change_column_value(item_id:${itemId}, board_id:${boardId}, 
          column_id: ${columnId}, value: "${JSON.stringify(value).replace(/"/g, '\\"')}") {
            id
          }
        }`
      },

      Mutate_TimelineColumn: (boardId, itemId, columnId, from, to) => {
        const value = {from, to }
         return `mutation {
          change_column_value(item_id:${itemId}, board_id:${boardId}, 
            column_id: ${columnId}, value: "${JSON.stringify(value).replace(/"/g, '\\"')}") {
              id
            }
          }`
        },

      Mutate_PeopleColumn: (boardId, itemId, columnId, ids) => {
        const data = {personsAndTeams: ids.map(id => ({id, kind:"person"}))};
        let values = JSON.stringify(data).replace(/"/g, '\\"');
        return `mutation {
          change_column_value(item_id: ${itemId}, board_id: ${boardId}, 
            column_id: ${columnId}, value: "${values}") {
                id
              }
          }`
    },

    Create_SubItem: (itemId, name) => 
        `mutation {
            create_subitem (parent_item_id: ${itemId}, item_name: "${name}") {
                id
                column_values{
                  text title id additional_info
                }
                board { id }
            }
        }`
}